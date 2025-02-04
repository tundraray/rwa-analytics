#!/bin/bash

# Проверка на root права
if [ "$EUID" -ne 0 ]; then 
    echo "Please run as root"
    exec sudo "$0" "$@"
    exit
fi

# Проверка и установка Java
check_java() {
    if command -v java >/dev/null 2>&1; then
        version=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}')
        echo "Found Java: $version"
        if [[ "$version" < "21" ]]; then
            return 1
        fi
        return 0
    fi
    return 1
}

# Установка Java 21
install_java() {
    echo "Installing Java 21..."
    if command -v apt-get >/dev/null 2>&1; then
        # Debian/Ubuntu
        wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
        echo "deb https://packages.adoptium.net/artifactory/deb $(awk -F= '/^VERSION_CODENAME/{print$2}' /etc/os-release) main" | tee /etc/apt/sources.list.d/adoptium.list
        apt-get update
        apt-get install -y temurin-21-jdk
    elif command -v dnf >/dev/null 2>&1; then
        # Fedora/RHEL
        dnf install -y java-21-openjdk-devel
    elif command -v brew >/dev/null 2>&1; then
        # macOS
        brew install --cask temurin
    else
        echo "Unsupported package manager. Please install Java 21 manually."
        exit 1
    fi
}

# Проверка и установка Flyway
check_flyway() {
    if command -v flyway >/dev/null 2>&1; then
        return 0
    fi
    return 1
}

# Установка Flyway
install_flyway() {
    echo "Installing Flyway..."
    if command -v apt-get >/dev/null 2>&1; then
        # Debian/Ubuntu
        wget -qO- https://repo1.maven.org/maven2/org/flywaydb/flyway-commandline/9.22.3/flyway-commandline-9.22.3-linux-x64.tar.gz | tar xvz
        sudo mkdir -p /opt/flyway
        sudo mv flyway-9.22.3/* /opt/flyway
        sudo ln -s /opt/flyway/flyway /usr/local/bin
    elif command -v brew >/dev/null 2>&1; then
        # macOS
        brew install flyway
    else
        echo "Please install Flyway manually from https://flywaydb.org/download/"
        exit 1
    fi
}

# Основной скрипт
echo "Checking dependencies..."

# Проверка Java
if ! check_java; then
    echo "Java 21 not found"
    install_java
    if ! check_java; then
        echo "Failed to install Java 21"
        exit 1
    fi
fi

# Проверка Flyway
if ! check_flyway; then
    echo "Flyway not found"
    install_flyway
    if ! check_flyway; then
        echo "Failed to install Flyway"
        exit 1
    fi
fi

echo "All dependencies are installed" 