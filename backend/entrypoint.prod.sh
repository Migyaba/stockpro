#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
while ! python -c "
import os, psycopg
url = os.environ.get('DATABASE_URL', '')
try:
    conn = psycopg.connect(url)
    conn.close()
    exit(0)
except Exception:
    exit(1)
" 2>/dev/null; do
  sleep 1
done

echo "PostgreSQL is ready!"

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Starting Gunicorn server..."
exec "$@"
