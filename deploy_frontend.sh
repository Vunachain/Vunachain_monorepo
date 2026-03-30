#!/bin/bash
set -e

# Build the frontend
cd /Users/mohamedalsayed/Documents/Vunachain_monorepo/apps/landing
pnpm install
pnpm build

# Copy build to Nginx web root (update this path as needed)
WEBROOT=/usr/share/nginx/html/vunachain
sudo mkdir -p "$WEBROOT"
sudo cp -r dist/* "$WEBROOT/"

# Reload Nginx to serve new build
sudo nginx -s reload

echo "Frontend deployed and Nginx reloaded!"