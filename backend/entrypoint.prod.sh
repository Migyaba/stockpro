#!/bin/sh
set -e

echo "Waiting for PostgreSQL..."
while ! python -c "
import os, psycopg
url = os.environ.get('DATABASE_URL')
try:
    if url:
        conn = psycopg.connect(url)
    else:
        conn = psycopg.connect(
            dbname=os.environ.get('POSTGRES_DB', 'stockpro'),
            user=os.environ.get('POSTGRES_USER', 'stockpro'),
            password=os.environ.get('POSTGRES_PASSWORD', 'stockpro'),
            host=os.environ.get('POSTGRES_HOST', 'localhost'),
            port=os.environ.get('POSTGRES_PORT', '5432')
        )
    conn.close()
    exit(0)
except Exception:
    try:
        conn = psycopg.connect(
            dbname=os.environ.get('POSTGRES_DB', 'stockpro'),
            user=os.environ.get('POSTGRES_USER', 'stockpro'),
            password=os.environ.get('POSTGRES_PASSWORD', 'stockpro'),
            host=os.environ.get('POSTGRES_HOST', 'localhost'),
            port=os.environ.get('POSTGRES_PORT', '5432')
        )
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
