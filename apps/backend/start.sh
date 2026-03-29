#!/bin/bash
set -e

echo "🚀 Starting Deployment Script..."

echo "-----------------------------------"
echo "🛠️  Step 1: Enable PostGIS..."
python manage.py enable_postgis || echo "⚠️ Warning: enable_postgis failed, but continuing..."

echo "-----------------------------------"
echo "🛠️  Step 2: Run Migrations..."
python manage.py migrate

echo "-----------------------------------"
echo "🛠️  Step 3: Collect Static Files..."
python manage.py collectstatic --noinput

echo "-----------------------------------"
echo "🛠️  Step 4: Create Admin User..."
python create_admin.py || echo "⚠️ Warning: Create Admin failed, skipping..."

echo "-----------------------------------"
echo "🚀 Step 5: Start Gunicorn..."
exec gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --log-level debug --access-logfile - --capture-output --enable-stdio-inheritance
