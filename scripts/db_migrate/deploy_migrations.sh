#!/bin/bash

# Default values for database connection
DB_HOST="localhost"
PORT="5432"
DATABASE=""
USER=""
PASSWORD=""
MIGRATIONS_DIR="db_output"
CLEAN=false
REPAIR=false

# Load from any .env* file if exists
for ENV_FILE in $(pwd)/.env*; do
    if [ -f "$ENV_FILE" ]; then
        echo "Loading environment from: $ENV_FILE"
        export $(cat "$ENV_FILE" | grep -v '^#' | xargs)
        # Override defaults with env values if they exist
        [ ! -z "$DB_HOST" ] && DB_HOST="$DB_HOST"
        [ ! -z "$DB_PORT" ] && PORT="$DB_PORT"
        [ ! -z "$DB_NAME" ] && DATABASE="$DB_NAME"
        [ ! -z "$DB_USERNAME" ] && USER="$DB_USERNAME"
        [ ! -z "$DB_PASSWORD" ] && PASSWORD="$DB_PASSWORD"
    fi
done

# Allow command line args to override both defaults and .env
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            DB_HOST="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        --db)
            DATABASE="$2"
            shift 2
            ;;
        --user)
            USER="$2"
            shift 2
            ;;
        --password)
            PASSWORD="$2"
            shift 2
            ;;
        --dir)
            MIGRATIONS_DIR="$2"
            shift 2
            ;;
        --clean)
            CLEAN=true
            shift
            ;;
        --repair)
            REPAIR=true
            shift
            ;;
        *)
            echo "Unknown parameter: $1"
            exit 1
            ;;
    esac
done

# Вывод текущей конфигурации
echo "Current configuration:"
echo "Host: $DB_HOST"
echo "Port: $PORT"
echo "Database: $DATABASE"
echo "User: $USER"
echo "Migrations directory: $MIGRATIONS_DIR"

# Создание конфигурационного файла Flyway
CONFIG_FILE="flyway.conf"
cat > "$CONFIG_FILE" << EOF
flyway.url=jdbc:postgresql://${DB_HOST}:${PORT}/${DATABASE}
flyway.user=$USER
flyway.password=$PASSWORD
flyway.locations=filesystem:$MIGRATIONS_DIR
flyway.sqlMigrationPrefix=V
flyway.sqlMigrationSeparator=__
flyway.placeholders.priority.tables=1
flyway.placeholders.priority.views=2
flyway.placeholders.priority.functions=3
flyway.placeholders.priority.triggers=4
flyway.placeholders.priority.data=5
flyway.validateMigrationNaming=true
flyway.outOfOrder=false
flyway.baselineOnMigrate=true
EOF

# Очистка и восстановление если указаны параметры
if [ "$CLEAN" = true ]; then
    echo "Cleaning database..."
    if ! flyway clean -configFiles="$CONFIG_FILE"; then
        echo "Clean failed"
        rm "$CONFIG_FILE"
        exit 1
    fi
fi

if [ "$REPAIR" = true ]; then
    echo "Repairing migration history..."
    if ! flyway repair -configFiles="$CONFIG_FILE"; then
        echo "Repair failed"
        rm "$CONFIG_FILE"
        exit 1
    fi
fi

# Запуск миграций
echo "Running database migrations..."
if flyway migrate -configFiles="$CONFIG_FILE" -executeInTransaction=false -X; then
    echo "Migration completed successfully"
else
    echo "Migration failed"
    rm "$CONFIG_FILE"
    exit 1
fi

# Очистка
rm "$CONFIG_FILE" 