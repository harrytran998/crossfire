#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: ./create-migration.sh <migration-name>"
    echo "Example: ./create-migration.sh add_player_avatars"
    exit 1
fi

MIGRATIONS_PATH="./packages/database/migrations"
migrate create -ext sql -dir "$MIGRATIONS_PATH" -seq "$1"

echo "Migration files created. Edit the .up.sql and .down.sql files."
