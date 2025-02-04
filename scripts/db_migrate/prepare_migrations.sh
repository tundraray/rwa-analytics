#!/bin/bash

set -e

# Директории
DB_DIR="./db"
OUTPUT_DIR="./db_output"

# Очистка выходной директории
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Функция для получения номера версии
get_version_number() {
    local count=$1
    printf "V%03d" $count
}

# Функция для создания имени миграции
create_migration_name() {
    local file=$1
    local name=$(basename "$file" .sql)
    echo "${name// /_}"
}

# Функция для определения зависимостей файла
get_dependencies() {
    local file=$1
    # Ищем упоминания других таблиц/представлений в файле
    grep -o "FROM \w\+" "$file" | cut -d' ' -f2
    grep -o "JOIN \w\+" "$file" | cut -d' ' -f2
    grep -o "REFERENCES \w\+" "$file" | cut -d' ' -f2
}

# Функция для получения номера версии из пути
get_version_from_path() {
    local file=$1
    local path_parts=(${file//// })  # Разбиваем путь на части
    for part in "${path_parts[@]}"; do
        if [[ $part =~ ^V[0-9]+$ ]]; then
            echo "$part"
            return
        fi
    done
    echo ""
}

# Функция для проверки, обработан ли файл
is_processed() {
    local file=$1
    for processed in "${processed_files[@]}"; do
        if [ "$processed" = "$file" ]; then
            return 0
        fi
    done
    return 1
}

# Обработка файлов и их зависимостей
count=1
processed_files=()

# Функция для обработки файла
process_file() {
    local file=$1
    local base_name=$(basename "$file")
    
    # Пропускаем, если файл уже обработан
    if is_processed "$base_name"; then
        return
    fi
    
    # Получаем зависимости
    local deps=($(get_dependencies "$file"))
    
    # Сначала обрабатываем зависимости
    for dep in "${deps[@]}"; do
        for version_dir in "$DB_DIR"/V*/; do
            if [ -d "$version_dir" ]; then
                for dep_file in "$version_dir/tables/$dep.sql" "$version_dir/functions/$dep.sql" "$version_dir/views/$dep.sql" "$version_dir/post_deployment/$dep.sql"; do
                    if [ -f "$dep_file" ] && ! is_processed "$(basename "$dep_file")"; then
                        process_file "$dep_file"
                    fi
                done
            fi
        done
    done
    
    # Обрабатываем текущий файл
    echo "Processing: $base_name"
    local version=$(get_version_from_path "$file")
    if [ -z "$version" ]; then
        version=$(get_version_number $count)
    fi
    migration_name=$(create_migration_name "$file")
    # Форматируем порядковый номер как трехзначное число
    local formatted_count=$(printf "%03d" $count)
    cp "$file" "$OUTPUT_DIR/${version}_${formatted_count}__${migration_name}.sql"
    processed_files+=("$base_name")
    ((count++))
}

# Обработка всех SQL файлов
echo "Processing SQL files..."

# Обработка всех версий
for version_dir in "$DB_DIR"/V*/; do
    if [ -d "$version_dir" ]; then
        # Обработка таблиц
        if [ -d "${version_dir}tables" ]; then
            for file in "${version_dir}tables"/*.sql; do
                if [ -f "$file" ]; then
                    process_file "$file"
                fi
            done
        fi

        # Обработка представлений
        if [ -d "${version_dir}views" ]; then
            for file in "${version_dir}views"/*.sql; do
                if [ -f "$file" ]; then
                    process_file "$file"
                fi
            done
        fi

        # Обработка функций
        if [ -d "${version_dir}functions" ]; then
            for file in "${version_dir}functions"/*.sql; do
                if [ -f "$file" ]; then
                    process_file "$file"
                fi
            done
        fi

         # Обработка функций
        if [ -d "${version_dir}post_deployment" ]; then
            for file in "${version_dir}post_deployment"/*.sql; do
                if [ -f "$file" ]; then
                    process_file "$file"
                fi
            done
        fi
    fi
done

echo "Migration files prepared in $OUTPUT_DIR"
