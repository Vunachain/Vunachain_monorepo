# Docker Deployment Guide

Complete guide for building and deploying the Vunachain application using Docker and Docker Compose.

---

## Overview

This guide covers building and deploying the Vunachain monorepo using Docker. The application stack includes:

- **Frontend**: React + Vite (Node.js)
- **Backend**: Django REST API (Python)
- **Database**: PostgreSQL
- **CMS**: Sanity (optional)

---

## Prerequisites

- Docker 20.10+ ([Install](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install](https://docs.docker.com/compose/install/))
- Git
- 4GB+ RAM
- 10GB+ disk space

### Verify Installation

```bash
docker --version
docker compose version
```

---

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/Vunachain/Vunachain_monorepo.git
cd Vunachain_monorepo
```

### 2. Create Environment File

```bash
cp .env.development.example .env.docker
```

Edit `.env.docker`:

```env
# Database
DB_NAME=vunachain
DB_USER=postgres
DB_PASSWORD=your_secure_password

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# APIs
GEMINI_API_KEY=your_key
SANITY_PROJECT_ID=your_id
MPESA_API_KEY=your_key
```

### 3. Build Images

```bash
# Build all services
docker compose build

# Build specific service
docker compose build frontend
docker compose build backend
```

### 4. Start Services

```bash
# Start all services (background)
docker compose up -d

# Start with logs visible
docker compose up

# Start specific services
docker compose up -d db backend
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs/
- **PostgreSQL**: localhost:5432

### 6. Run Database Migrations

```bash
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py collectstatic --noinput
```

---

## Build Manually

### Frontend Only

```bash
cd apps/landing

# Build image
docker build -t vunachain-frontend:latest .

# Run container
docker run -p 3000:3000 vunachain-frontend:latest
```

### Backend Only

```bash
cd apps/backend

# Build image
docker build -t vunachain-backend:latest .

# Run container
docker run \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@localhost:5432/vunachain \
  vunachain-backend:latest
```

---

## Docker Compose Services

### Database Service (PostgreSQL)

```yaml
db:
  - Port: 5432
  - Volume: postgres_data
  - Healthcheck: pg_isready
```

Access:

```bash
# Connect to PostgreSQL
docker compose exec db psql -U postgres -d vunachain

# Backup database
docker compose exec db pg_dump -U postgres vunachain > backup.sql

# Restore database
docker compose exec -T db psql -U postgres vunachain < backup.sql
```

### Backend Service (Django)

```yaml
backend:
  - Port: 8000
  - Dependencies: db
  - Healthcheck: HTTP /health
```

Common commands:

```bash
# Run migrations
docker compose exec backend python manage.py migrate

# Create superuser
docker compose exec backend python manage.py createsuperuser

# Collect static files
docker compose exec backend python manage.py collectstatic --noinput

# Run Django shell
docker compose exec backend python manage.py shell

# Run tests
docker compose exec backend pytest

# Check logs
docker compose logs backend -f
```

### Frontend Service (React)

```yaml
frontend:
  - Port: 3000
  - Dependencies: backend
  - Healthcheck: HTTP /
```

### Network & Volumes

**Network**: `vunachain_network`
- Allows services to communicate by hostname
- E.g., backend can access db as `db:5432`

**Volumes**:
- `postgres_data`: Persists database data

---

## Common Tasks

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db

# Last 50 lines
docker compose logs --tail=50 backend
```

### Stop Services

```bash
# Stop all (preserves data)
docker compose stop

# Stop specific service
docker compose stop backend

# Stop and remove containers
docker compose down

# Stop and remove everything (including volumes)
docker compose down -v
```

### Execute Commands

```bash
# Run command in running container
docker compose exec backend python manage.py shell

# Run Django tests
docker compose exec backend pytest

# Install new Python package
docker compose exec backend pip install package-name

# Interactive shell
docker compose exec backend bash
```

### Rebuild After Code Changes

```bash
# Rebuild and restart backend
docker compose down backend
docker compose build backend
docker compose up -d backend

# Or in one command
docker compose up -d --build backend
```

### Scale Services

```bash
# Run 3 instances of backend
docker compose up -d --scale backend=3

# Note: Only works with stateless services
```

---

## Deployment

### Production Build

```bash
# Build optimized images
docker build --target production -t vunachain-backend:latest apps/backend/
docker build -t vunachain-frontend:latest apps/landing/

# Tag for registry
docker tag vunachain-backend:latest myregistry/vunachain-backend:1.0.0
docker tag vunachain-frontend:latest myregistry/vunachain-frontend:1.0.0

# Push to registry
docker push myregistry/vunachain-backend:1.0.0
docker push myregistry/vunachain-frontend:1.0.0
```

### Using Docker Registries

#### Docker Hub

```bash
# Login
docker login

# Tag
docker tag vunachain-backend username/vunachain-backend:1.0.0

# Push
docker push username/vunachain-backend:1.0.0
```

#### GitHub Container Registry

```bash
# Login
docker login ghcr.io -u USERNAME -p TOKEN

# Tag
docker tag vunachain-backend ghcr.io/vunachain/vunachain-backend:1.0.0

# Push
docker push ghcr.io/vunachain/vunachain-backend:1.0.0
```

### Environment-Specific Compose Files

```bash
# Development
docker compose -f docker-compose.yml up

# Production
docker compose -f docker-compose.yml -f docker-compose.prod.yml up

# Staging
docker compose -f docker-compose.yml -f docker-compose.staging.yml up
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Database Connection Refused

```bash
# Check db is running
docker compose ps db

# Check logs
docker compose logs db

# Restart database
docker compose restart db

# Wait for health check
docker compose up db --wait
```

### Out of Memory

```bash
# Increase Docker memory in settings
# Docker Desktop: Settings > Resources > Memory

# Or limit service memory in compose
services:
  backend:
    mem_limit: 512m
```

### Permissions Error

```bash
# Ensure user is added to docker group
sudo usermod -aG docker $USER

# Restart Docker daemon
sudo systemctl restart docker

# Log out and back in for group changes to take effect
```

### Dependencies Not Installing

```bash
# Clear cache and rebuild
docker compose build --no-cache backend

# Check requirements.txt syntax
docker compose exec backend pip list
```

### Permission Denied in Container

```bash
# Run with different user
docker compose exec -u 0 backend bash

# Fix permissions
docker compose exec -u 0 backend chown -R appuser:appuser /app
```

---

## Health Checks

Services have health checks configured:

```bash
# Check service health
docker compose ps

# Example output:
# NAME              STATUS
# vunachain_db      Up 2 minutes (healthy)
# vunachain_backend Up 1 minute (healthy)
# vunachain_frontend Up 1 minute (healthy)
```

---

## Monitoring & Logging

### Docker Stats

```bash
# View resource usage
docker stats

# Watch specific service
docker stats vunachain_backend
```

### Container Logs

```bash
# Follow logs with timestamps
docker compose logs -f --timestamps backend

# Follow all logs
docker compose logs -f

# Get last N lines
docker compose logs --tail=100 backend
```

---

## Security Best Practices

1. **Use Environment Variables**
   - Never commit secrets
   - Use `.env.docker` (add to .gitignore)

2. **Non-root Users**
   - Backend runs as `appuser` (uid 1000)
   - Frontend runs as default node user

3. **Network Isolation**
   - Services on private network
   - Only expose necessary ports

4. **Image Scanning**
   ```bash
   docker scout cves vunachain-backend:latest
   ```

5. **Regular Updates**
   ```bash
   docker pull postgres:15-alpine
   docker pull node:20-alpine
   docker pull python:3.11-slim
   ```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build backend
        run: docker build -t ghcr.io/vunachain/backend:${{ github.sha }} apps/backend/

      - name: Build frontend
        run: docker build -t ghcr.io/vunachain/frontend:${{ github.sha }} apps/landing/

      - name: Push images
        run: |
          docker push ghcr.io/vunachain/backend:${{ github.sha }}
          docker push ghcr.io/vunachain/frontend:${{ github.sha }}
```

---

## Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Security](https://docs.docker.com/engine/security/)

---

**Last Updated:** March 30, 2026
