# 📦 Dependency Update Guide

**Last Review:** March 30, 2026
**Next Review:** June 30, 2026

---

## Overview

This document tracks deprecated and outdated dependencies identified in the Vunachain monorepo and provides upgrade recommendations.

---

## Critical Updates

### 1. MetaMask SDK (Deprecated)

**Current:** `@metamask/sdk@0.33.1` (deprecated)
**Recommendation:** Monitor for replacement or official upgrade path

**Impact:** MetaMask wallet integration
**Severity:** MEDIUM
**Status:** Waiting for MetaMask official guidance

**Action:**
```bash
# Monitor for new versions
npm view @metamask/sdk versions

# Upgrade once stable version is available
pnpm update @metamask/sdk -L
```

---

### 2. WalletConnect (Multiple Versions)

**Current:**
- `@walletconnect/ethereum-provider@2.21.1` (deprecated)
- `@walletconnect/sign-client@2.21.x` (deprecated)
- `@walletconnect/universal-provider@2.21.x` (deprecated)

**Latest:** v2.22+
**Recommendation:** Update to latest v2 or v3

**Impact:** WalletConnect functionality (mobile wallets, etc.)
**Severity:** MEDIUM
**Status:** Safe to update

**Action:**
```bash
# Update WalletConnect packages
pnpm update @walletconnect/ethereum-provider -L
pnpm update @walletconnect/sign-client -L
pnpm update @walletconnect/universal-provider -L

# Or update all in one command
pnpm update "@walletconnect/*" -L
```

**Testing Required:**
```bash
# After update, test wallet connections
pnpm dev  # Start dev server
# Manually test:
# 1. Connect with WalletConnect
# 2. Test QR code generation
# 3. Test mobile wallet pairing
```

---

### 3. Glob Utilities (Multiple Versions)

**Current:**
- `glob@5.0.15`, `glob@7.1.7`, `glob@7.2.3`, `glob@8.1.0`

**Latest:** v10.x
**Recommendation:** Update through dependency chains

**Impact:** File globbing in build tools
**Severity:** LOW
**Status:** Will update with dependency updates

**Note:** These are transitive dependencies from build tools. They'll be updated when upgrading the parent packages.

---

## Frontend Package Updates

### Dependencies to Monitor

| Package | Current | Latest | Priority | Notes |
|---------|---------|--------|----------|-------|
| `react` | 19.0.0 | 19.x | Keep current | Already latest major version |
| `wagmi` | 2.19.5 | 2.x / 3.x? | Monitor | Check compatibility with other web3 libs |
| `viem` | 2.45.1 | 2.x / 3.x? | Monitor | Keep in sync with wagmi |
| `@rainbow-me/rainbowkit` | 2.2.10 | 2.x / 3.x? | Monitor | Check WalletConnect compatibility |
| `@sentry/react` | 8.30.0 | Latest | Safe to update | Error tracking is isolated |
| `@tanstack/react-query` | 5.90.20 | 5.x / 6.x? | Monitor | Check caching behavior |

---

## Backend Package Updates

### Python Dependencies (apps/backend/requirements.txt)

```
Django==4.2.10              # Keep on 4.2 LTS until 5.0 is stable
djangorestframework==3.14.0 # Latest stable
web3==6.15.1                # Latest; test blockchain integration
requests==2.31.0            # Latest; test API calls
psycopg2-binary>=2.9.1      # Latest binary available
```

**Update Process:**
```bash
cd apps/backend

# Update specific packages
pip install --upgrade django djangorestframework web3 requests psycopg2-binary

# Verify no breaking changes
python manage.py test  # Run tests if available

# Update requirements.txt
pip freeze > requirements.txt
```

---

## Update Strategy

### Phase 1: Low Risk (Immediate)

✅ **Already Updated:**
- Landing app: All linting dependencies fixed
- Type safety: All `any` types resolved

⚠️ **Recommended Updates:**
1. Sentry SDKs (error tracking - isolated impact)
2. Utility libraries (glob, lodash, etc. - no behavioral impact)

### Phase 2: Medium Risk (Next Sprint)

1. Update WalletConnect packages
2. Update Tailwind CSS plugins
3. Update dev dependencies

**Validation:**
```bash
# After each update
pnpm -r lint
pnpm -r build
pnpm -C apps/landing dev  # Manual wallet connection test
```

### Phase 3: High Risk (Plan Ahead)

1. MetaMask SDK - Wait for official replacement
2. wagmi/viem - Monitor for major versions
3. rainbowkit - Update in sync with wagmi

**Requires:**
- Full integration testing
- Mobile wallet testing
- Mainnet dry-run (with testnet account)

---

## Testing Checklist

Before committing dependency updates, verify:

### Web3 Functionality
- [ ] Wallet connection works (MetaMask)
- [ ] WalletConnect QR code generation
- [ ] Mobile wallet pairing
- [ ] Contract interaction
- [ ] Transaction signing
- [ ] Balance display

### Frontend
- [ ] Build succeeds: `pnpm build`
- [ ] No TypeScript errors: `pnpm type-check`
- [ ] Lint passes: `pnpm lint`
- [ ] Dev server starts: `pnpm dev`
- [ ] No console errors in browser
- [ ] Forms submit correctly

### Backend
- [ ] API endpoints respond
- [ ] Database migrations work
- [ ] Web3 integration functions
- [ ] Error tracking works (Sentry)

---

## Automated Updates

### GitHub Dependabot

**Recommended Configuration** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/apps/landing"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "03:00"
    allow:
      - dependency-type: "all"
    reviewers:
      - "vunachain-devops"

  - package-ecosystem: "pip"
    directory: "/apps/backend"
    schedule:
      interval: "weekly"
    allow:
      - dependency-type: "all"

  - package-ecosystem: "npm"
    directory: "/apps/protocol"
    schedule:
      interval: "weekly"
```

### Snyk Integration

Use Snyk for security vulnerability scanning:
```bash
npm install -g snyk
snyk auth
snyk test ./apps/landing
snyk monitor ./apps/landing
```

---

## Emergency Updates

If security vulnerabilities are discovered:

### 1. Identify Affected Package
```bash
npm audit
pnpm audit
pip check
```

### 2. Emergency Update
```bash
# NPM emergency
pnpm update PACKAGE_NAME --latest

# Python emergency
pip install --upgrade PACKAGE_NAME
```

### 3. Verify
```bash
# Run full test suite
pnpm test
python manage.py test

# Check for breaking changes in output
pnpm build
pnpm lint
```

### 4. Deploy
```bash
git push origin emergency-fix/PACKAGE_NAME
# Create PR with security label
```

---

## Quarterly Review Checklist

Every 3 months (June 30, September 30, December 30, March 31):

- [ ] Run `pnpm outdated` / `npm outdated`
- [ ] Review npm advisories: https://www.npmjs.com/advisories
- [ ] Check for deprecated package notices
- [ ] Review security reports from Snyk/GitHub
- [ ] Plan updates for next quarter
- [ ] Schedule testing window for web3 updates
- [ ] Update this document with findings

---

## References

- [npm Docs: Updating Packages](https://docs.npmjs.com/updating-packages-and-dependencies)
- [pnpm Docs: Update Packages](https://pnpm.io/cli/update)
- [MetaMask SDK](https://github.com/MetaMask/metamask-sdk)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [wagmi Documentation](https://wagmi.sh/)
- [Snyk Security Scanning](https://snyk.io/)

---

**Next Review Date:** June 30, 2026
