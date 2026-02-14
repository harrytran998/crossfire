#!/bin/bash
set -e

MIGRATIONS_PATH="./packages/database/migrations"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/crossfire}"

migrate -database "$DATABASE_URL" -path "$MIGRATIONS_PATH" up
