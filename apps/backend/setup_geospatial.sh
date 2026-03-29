#!/bin/bash

# Vunachain Geospatial Setup Script (macOS)
# This script installs system-level dependencies for GeoDjango (PostGIS, GDAL, etc.)

echo "🚀 Starting Vunachain Geospatial Setup..."

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Please install it first: https://brew.sh/"
    exit 1
fi

echo "📦 Installing system dependencies via Homebrew..."
brew install postgis
brew install gdal
brew install geos
brew install proj

echo "⚙️ Configuring environment variables..."
# Link GDAL for Python
export GDAL_LIBRARY_PATH=$(brew --prefix gdal)/lib/libgdal.dylib
export GEOS_LIBRARY_PATH=$(brew --prefix geos)/lib/libgeos_c.dylib

echo "✅ System dependencies installed."
echo "💡 To use these in your shell, add the following to your .zshrc or .bash_profile:"
echo "export GDAL_LIBRARY_PATH=$(brew --prefix gdal)/lib/libgdal.dylib"
echo "export GEOS_LIBRARY_PATH=$(brew --prefix geos)/lib/libgeos_c.dylib"

echo "🐍 Now install Python dependencies:"
echo "pip install -r Vunachain_backend/backend/requirements.txt"

echo "🚀 Setup complete! You are ready for geospatial development."
