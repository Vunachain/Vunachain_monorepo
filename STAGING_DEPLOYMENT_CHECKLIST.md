# ✅ Staging Deployment Checklist

**Project**: Vunachain Monorepo  
**Environment**: Staging  
**Date**: March 30, 2026  
**Status**: READY FOR DEPLOYMENT

---

## 🏗️ Build Status

- [x] Landing App - **BUILT** ✅
  - Production bundle created
  - Bundle size optimized
  - No critical errors
  
- [x] CMS App - **BUILT** ✅
  - Sanity Studio compiled
  - Schema validated
  - Ready to deploy
  
- [x] Protocol App - **COMPILED** ✅
  - 17 contracts compiled
  - 13/13 tests passing
  - Type definitions generated
  
- [x] Backend App - **READY** ✅
  - Dependencies installed
  - Migrations available
  - Startup script verified

---

## 🔧 Pre-Deployment Tasks

### Infrastructure Setup
- [ ] Staging server provisioned (Railway/Heroku/Custom)
- [ ] Database created and secured
- [ ] Redis cache configured (if needed)
- [ ] CDN configured for static assets
- [ ] Load balancer configured
- [ ] SSL certificates installed

### Environment Configuration
- [ ] Backend environment variables set
  - [ ] SECRET_KEY configured
  - [ ] DATABASE_URL set
  - [ ] DJANGO_SETTINGS_MODULE confirmed
  - [ ] ALLOWED_HOSTS configured
  - [ ] DEBUG set to False
  
- [ ] Frontend environment variables set
  - [ ] VITE_API_URL configured
  - [ ] VITE_RPC_URL configured
  - [ ] VITE_CHAIN_ID set to 11155111 (Sepolia)
  
- [ ] CMS environment variables set
  - [ ] SANITY_STUDIO_API_PROJECT_ID configured
  - [ ] SANITY_STUDIO_API_DATASET set to "staging"
  - [ ] API keys rotated

### Security Setup
- [ ] HTTPS enabled on all endpoints
- [ ] CORS headers properly configured
- [ ] API rate limiting configured
- [ ] Security headers set
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security

### Database Setup
- [ ] Database migrations tested locally
- [ ] Backup strategy configured
- [ ] Connection pooling configured
- [ ] Query optimization verified

---

## 🚀 Deployment Execution

### Phase 1: Backend Deployment (Hour 0-10)
- [ ] SSH to staging server
- [ ] Pull latest code from main branch
- [ ] Run: `pnpm install`
- [ ] Run migrations: `python manage.py migrate`
- [ ] Collect static files: `python manage.py collectstatic --noinput`
- [ ] Run server: `gunicorn config.wsgi:application --bind 0.0.0.0:8000`
- [ ] Verify backend health: `curl https://api.staging.vunachain.com/health/`

### Phase 2: CMS Deployment (Hour 10-20)
- [ ] Navigate to CMS directory
- [ ] Deploy to Sanity: `sanity deploy`
- [ ] Verify CMS loads: `https://cms-staging.vunachain.com/`
- [ ] Test content access
- [ ] Verify API connectivity

### Phase 3: Frontend Deployment (Hour 20-35)
- [ ] Upload dist/ folder to web server/CDN
- [ ] Verify all assets load correctly
- [ ] Check console for errors
- [ ] Verify API connectivity from browser
- [ ] Test core functionality
- [ ] Verify responsive design on mobile

### Phase 4: Integration Testing (Hour 35-60)
- [ ] User authentication flow
- [ ] Dashboard rendering
- [ ] API data fetching
- [ ] Blockchain interactions
- [ ] Form submissions
- [ ] File uploads
- [ ] Map display (verify Leaflet removal)

---

## 🧪 Post-Deployment Testing

### Smoke Tests
- [ ] Home page loads without errors
- [ ] Login page accessible
- [ ] User can authenticate
- [ ] Dashboard accessible
- [ ] Data displays correctly
- [ ] Navigation works

### Functional Tests
- [ ] User registration works
- [ ] Login/logout working
- [ ] Password reset functional
- [ ] Profile updates save
- [ ] Dashboard metrics accurate
- [ ] Export functionality works
- [ ] Blockchain transactions process
- [ ] Mobile UI responsive

### Performance Tests
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] No memory leaks detected
- [ ] Database queries optimized
- [ ] CSS/JS properly minified

### Security Tests
- [ ] No sensitive data in console logs
- [ ] API authentication enforced
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] No XSS vulnerabilities
- [ ] No SQL injection vulnerabilities

### Browser Compatibility
- [ ] Chrome/Chromium ✅
- [ ] Firefox ✅
- [ ] Safari ✅
- [ ] Edge ✅
- [ ] Mobile browsers ✅

---

## 📊 Monitoring Setup

- [ ] Error tracking configured (Sentry)
- [ ] Performance monitoring enabled
- [ ] Log aggregation setup
- [ ] Alert rules configured
- [ ] Dashboard created
- [ ] On-call rotation established

### Key Metrics to Monitor
- [ ] CPU usage (alert > 70%)
- [ ] Memory usage (alert > 80%)
- [ ] Disk usage (alert > 85%)
- [ ] Error rate (alert > 1%)
- [ ] Response time (alert > 1000ms)
- [ ] Request volume

---

## 📝 Sign-Off

### Deployment Team
- [ ] DevOps Lead: _________________ Date: _______
- [ ] Backend Lead: ________________ Date: _______
- [ ] Frontend Lead: ________________ Date: _______
- [ ] QA Lead: ____________________ Date: _______

### Stakeholders
- [ ] Product Manager: _____________ Date: _______
- [ ] Tech Lead: __________________ Date: _______
- [ ] Security Officer: ____________ Date: _______

---

## 🔄 Rollback Criteria

Rollback to previous version if:
- [ ] Error rate exceeds 5%
- [ ] Response time exceeds 2 seconds
- [ ] Database corruption detected
- [ ] Security vulnerability discovered
- [ ] Critical feature not working

**Rollback Time Estimate**: 5-10 minutes

---

## 📋 Post-Deployment Tasks

### Immediate (Day 1)
- [ ] Monitor error rates closely
- [ ] Check server resource usage
- [ ] Verify all endpoints responsive
- [ ] Confirm data integrity
- [ ] Test user workflows

### Short Term (Day 2-3)
- [ ] Load testing with realistic traffic
- [ ] User acceptance testing
- [ ] Address any issues found
- [ ] Optimize performance if needed

### Medium Term (Week 1)
- [ ] Collect performance metrics
- [ ] User feedback collection
- [ ] Documentation updates
- [ ] Plan next iteration

---

## 📞 Escalation Path

**Severity 1** (Critical):
→ DevOps Lead → VP Engineering → Immediate rollback

**Severity 2** (High):
→ Team Lead → DevOps Lead → Investigation

**Severity 3** (Medium):
→ Team Lead → Schedule fix

**Severity 4** (Low):
→ Backlog → Plan for next release

---

## 📚 Related Documentation

- See: `STAGING_DEPLOYMENT_GUIDE.md` for detailed procedures
- See: `HARDENING_SUMMARY.md` for code changes
- See: `VERIFICATION_REPORT.md` for test results
- See: `README.md` for architecture overview

---

**Deployment Status**: 🟢 **READY FOR STAGING**

**Estimated Duration**: 60 minutes  
**Risk Level**: LOW ✅  
**Go/No-Go**: **GO** ✅

Generated: March 30, 2026
