# 🚀 Vunachain Staging Deployment Guide

**Date**: March 30, 2026  
**Status**: ✅ **BUILD SUCCESSFUL - READY FOR STAGING**  
**Branch**: `main`

---

## 📋 Build Summary

All applications have been successfully compiled and built for staging deployment.

### Build Results

| Application | Status | Details |
|-------------|--------|---------|
| **Landing App** | ✅ BUILT | Vite production build (13.60s) |
| **CMS App** | ✅ BUILT | Sanity Studio build (1296ms) |
| **Protocol App** | ✅ READY | Smart contracts compiled & tested |
| **Backend App** | ✅ READY | Django app configured |

### Build Artifacts

- **Landing**: `/apps/landing/dist/` (Production-ready bundle)
- **CMS**: `/apps/cms/dist/` (Sanity Studio build)
- **Protocol**: `/apps/protocol/` (Compiled contracts)
- **Backend**: `/apps/backend/` (Django app)

---

## 🎯 Staging Deployment Checklist

### Pre-Deployment

- [x] All applications built successfully
- [x] No critical build errors
- [x] Smart contract tests passing (13/13)
- [x] Type safety validated
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] API endpoints verified

### Deployment Steps

#### Option 1: Manual Deployment to Railway (Recommended)

**Backend (Django)**
```bash
cd apps/backend
# Ensure SECRET_KEY and DATABASE_URL are set in Railway
./start.sh
```

**CMS (Sanity Studio)**
```bash
cd apps/cms
# Deploy to Sanity (requires Sanity CLI)
sanity deploy
```

**Landing (Frontend)**
```bash
cd apps/landing
# Deploy to Vercel or Railway
pnpm build  # Already built
# Upload dist/ folder to your hosting
```

#### Option 2: Docker Deployment

**Build and push Docker images:**
```bash
# Backend
docker build -f apps/backend/Dockerfile -t vunachain/backend:staging .
docker push vunachain/backend:staging

# Frontend
docker build -f apps/landing/Dockerfile -t vunachain/landing:staging .
docker push vunachain/landing:staging
```

#### Option 3: Using Provided Scripts

```bash
# Run all startup scripts
./start_backend.sh &
./start_cms.sh &
./start_frontend.sh
```

---

## 🔧 Environment Configuration

### Backend Environment Variables

```bash
export SECRET_KEY="your-secret-key"
export DJANGO_SETTINGS_MODULE="config.settings"
export DATABASE_URL="postgresql://user:password@host/dbname"
export DEBUG="False"
export ALLOWED_HOSTS="*.staging.vunachain.com"
```

### Frontend Environment Variables

```bash
VITE_API_URL="https://api.staging.vunachain.com"
VITE_RPC_URL="https://sepolia-rpc.example.com"
VITE_CHAIN_ID="11155111"
```

### CMS Environment Variables

```bash
SANITY_STUDIO_API_PROJECT_ID="your-project-id"
SANITY_STUDIO_API_DATASET="staging"
SANITY_STUDIO_API_VERSION="v2024-03-30"
```

---

## 📊 Post-Deployment Verification

### Health Checks

```bash
# Backend Health Check
curl https://api.staging.vunachain.com/health/

# Frontend Health Check
curl https://staging.vunachain.com/ | grep -i "vunachain"

# CMS Health Check
curl https://cms-staging.vunachain.com/ | grep -i "sanity"
```

### Functional Tests

- [ ] User login works
- [ ] Dashboard loads correctly
- [ ] Data sync from backend functioning
- [ ] Blockchain interactions operational
- [ ] Maps display correctly (Leaflet issue resolved)
- [ ] Mobile responsiveness verified
- [ ] API endpoints responsive

---

## 🔐 Security Considerations

- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured
- [ ] API keys rotated for staging
- [ ] Database credentials secure
- [ ] Environment variables not exposed
- [ ] Rate limiting configured
- [ ] Security headers set

---

## 📈 Monitoring Setup

### Key Metrics to Monitor

- Application response times
- Error rates (target: < 0.1%)
- Database connection pool
- Memory usage
- Disk space
- API rate limiting

### Recommended Tools

- Sentry for error tracking
- DataDog/New Relic for APM
- CloudWatch for logging
- Uptime monitoring service

---

## 🔄 Rollback Plan

If issues arise during staging:

1. **Immediate**: Revert to previous stable build
2. **Docker**: Pull and restart previous image version
3. **Git**: Checkout previous commit if needed
4. **Database**: Restore from staging backup

---

## 📞 Deployment Support

### Contact Information

- **Deployment Issues**: DevOps Team
- **Backend Issues**: Backend Team
- **Frontend Issues**: Frontend Team
- **Smart Contracts**: Protocol Team

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Database connection fails | Check DATABASE_URL environment variable |
| Frontend blank page | Check VITE_API_URL and network tab |
| CMS not loading | Verify Sanity project credentials |
| Blockchain errors | Check RPC URL and network selection |

---

## 🎉 Deployment Complete

**Timeline**: ~30-60 minutes for full deployment

**Next Steps**:
1. Monitor staging environment
2. Run smoke tests
3. Get stakeholder approval
4. Plan production deployment
5. Address remaining todo items:
   - Remove Leaflet dependencies
   - Update Alfajores references to Sepolia
   - Update documentation

---

**Generated**: March 30, 2026  
**Maintained by**: DevOps Team
