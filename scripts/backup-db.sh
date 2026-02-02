#!/bin/bash
# Backup PostgreSQL database
# Usage: ./scripts/backup-db.sh [output_dir]
# Requires DATABASE_URL in .env

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="${1:-$PROJECT_DIR/backups}"
mkdir -p "$OUTPUT_DIR"

if [ -f "$PROJECT_DIR/.env" ]; then
  source "$PROJECT_DIR/.env"
fi

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL not set"
  exit 1
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$OUTPUT_DIR/fitness_$TIMESTAMP.sql"
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"
echo "Backup saved: $BACKUP_FILE"
