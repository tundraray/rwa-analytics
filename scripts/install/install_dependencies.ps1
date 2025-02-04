# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (!$isAdmin) {
    Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Wait
    exit
}

# Check if Chocolatey is installed
if (!(Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))
    refreshenv
}

# Check Java version and update JAVA_HOME
Write-Host "Checking Java version..."
try {
    $javaVersion = & java -version 2>&1 | Select-String -Pattern "version" | ForEach-Object { $_.ToString() }
    Write-Host "Found Java: $javaVersion"
    
    $needsJava = $false
    if ($javaVersion -match '"([0-9]+\.[0-9]+)') {
        $version = [version]$Matches[1]
        if ($version -lt [version]"21.0") {
            $needsJava = $true
        }
    } else {
        $needsJava = $true
    }

    if ($needsJava) {
        Write-Host "Installing Java 21..." -ForegroundColor Yellow
        choco install temurin -y
        
        # Update JAVA_HOME
        $javaPath = "C:\Program Files\Eclipse Adoptium\jdk-21.0.5.11-hotspot"
        if (Test-Path $javaPath) {
            [System.Environment]::SetEnvironmentVariable("JAVA_HOME", $javaPath, [System.EnvironmentVariableTarget]::Machine)
            Write-Host "JAVA_HOME updated to: $javaPath" -ForegroundColor Green
            
            # Update PATH
            $path = [System.Environment]::GetEnvironmentVariable("PATH", [System.EnvironmentVariableTarget]::Machine)
            if ($path -notlike "*$javaPath\bin*") {
                [System.Environment]::SetEnvironmentVariable("PATH", "$javaPath\bin;$path", [System.EnvironmentVariableTarget]::Machine)
                Write-Host "PATH updated with Java 21" -ForegroundColor Green
            }
        }
        
        refreshenv
        Write-Host "Java 21 installed successfully" -ForegroundColor Green
    } else {
        Write-Host "Java 21 is already installed" -ForegroundColor Green
    }
} catch {
    Write-Host "Error checking Java: $_" -ForegroundColor Red
    exit 1
}

# Check if Flyway is installed
if (!(Get-Command flyway -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Flyway..." -ForegroundColor Yellow
    choco install flyway.commandline -y
    refreshenv
    Write-Host "Flyway installed successfully" -ForegroundColor Green
} else {
    Write-Host "Flyway is already installed" -ForegroundColor Green
}

Write-Host "`nAll dependencies are installed and up to date" -ForegroundColor Green
Write-Host "Please restart your terminal to apply the environment changes" -ForegroundColor Yellow 