#!/bin/bash
set -e
cd /Users/mohamedalsayed/Documents/Vunachain_monorepo/apps/backend

# Check for required environment variables
if [[ -z "$SECRET_KEY" ]]; then
	echo "ERROR: SECRET_KEY environment variable is not set."
	exit 1
fi
if [[ -z "$DJANGO_SETTINGS_MODULE" ]]; then
	export DJANGO_SETTINGS_MODULE=config.settings
fi
if [[ -z "$DATABASE_URL" ]]; then
	echo "WARNING: DATABASE_URL not set. Using default SQLite."
fi

# Collect static files (if not already done)
./venv/bin/python manage.py collectstatic --noinput

# Run migrations
./venv/bin/python manage.py migrate --noinput

# Start Gunicorn for production
exec ./venv/bin/gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4 --timeout 120
