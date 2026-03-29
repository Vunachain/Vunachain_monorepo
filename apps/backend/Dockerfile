# Use an official Python runtime as a parent image
FROM python:3.11.8-slim

# Prevent Python from writing pyc files to disc and buffering stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system dependencies required for GeoDjango and GDAL
# We install software-properties-common to manage repositories if needed, 
# but for standard gdal-bin and libgdal-dev, standard repos are usually fine.
RUN apt-get update && apt-get install -y \
    binutils \
    libproj-dev \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip

# Dynamic GDAL Version Matching 🛠️
# We must install the Python bindings that EXACTLY match the system libgdal version.
# PIP normally grabs the "latest", which causes compilation errors against older apt libs.
RUN export CPLUS_INCLUDE_PATH=/usr/include/gdal \
    && export C_INCLUDE_PATH=/usr/include/gdal \
    && pip install GDAL==$(gdal-config --version)

RUN pip install --no-cache-dir -r requirements.txt

# Copy project
COPY . /app/

# Expose port (Railway typically uses $PORT but we default to 8000)
ENV PORT=8000
EXPOSE 8000

# Start command: Run migrations, collect static files, then start Gunicorn
CMD python manage.py migrate && \
    python manage.py collectstatic --noinput && \
    gunicorn config.wsgi:application --bind 0.0.0.0:$PORT
