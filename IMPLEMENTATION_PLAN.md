# 🔧 Implementation Plan: Vunachain Audit Fixes

**Plan Date:** March 30, 2026
**Target Completion:** April 6, 2026 (1 week)
**Priority:** Get to production-ready status

---

## 1. CRITICAL ISSUES (Days 1-2)

### 1.1 Fix Protocol App Hardhat ESM/CJS Configuration

**Issue:** Hardhat config fails to load due to "type": "module" in package.json
**Impact:** Cannot compile smart contracts or run tests
**Effort:** 30 minutes
**Priority:** CRITICAL - Blocks everything else

#### Solution A (Recommended): Change to CommonJS

**Files to Modify:**
- `apps/protocol/package.json` - Remove "type": "module"
- `apps/protocol/hardhat.config.ts` - Keep as-is (will work as CommonJS now)

**Steps:**
```bash
# 1. Edit package.json
# Remove the line: "type": "module"

# 2. Verify hardhat.config.ts works with CommonJS
cd apps/protocol
npm test                    # Run smart contract tests
npm run compile             # Compile contracts
```

**Why This Works:**
- Hardhat is fundamentally CommonJS-based
- The rest of the protocol app can use CommonJS
- No code changes needed - only config

**Risks:** Low - Protocol app is isolated, no dependencies on ESM from other apps

**Testing:**
- [ ] `pnpm -C apps/protocol compile` succeeds
- [ ] `pnpm -C apps/protocol test` passes all 13 tests
- [ ] No new linting errors

---

#### Solution B (Alternative): Use hardhat.config.cjs

If you want to keep "type": "module" for the protocol app:

**Steps:**
```bash
# 1. Rename the file
mv apps/protocol/hardhat.config.ts apps/protocol/hardhat.config.cjs

# 2. Convert import/export to require/module.exports
# (Convert TypeScript imports to CommonJS require)
```

**Conversion Example:**
```typescript
// BEFORE (hardhat.config.ts - ESM)
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = { ... };
export default config;

// AFTER (hardhat.config.cjs - CommonJS)
const { config } = require("./hardhat.config.ts");
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
  // ... config
};
```

**Recommendation:** Use Solution A (simpler, less risk)

---

### 1.2 Verify Protocol App Builds After Fix

**Effort:** 15 minutes
**Dependencies:** Must complete 1.1 first

**Steps:**
```bash
# Test full compilation
pnpm -C apps/protocol compile

# Expected output:
# ✓ Compiled 17 Solidity files successfully (evm target: paris)
# ✓ Generated 60 TypeChain typings
# ✓ Zero warnings

# Run smart contract tests
pnpm -C apps/protocol test

# Expected output:
# 13 passing (625ms)
```

**Verification Checklist:**
- [ ] Zero compilation errors
- [ ] Zero compilation warnings
- [ ] All 13 tests passing
- [ ] TypeChain bindings generated

---

## 2. HIGH PRIORITY ISSUES (Days 2-5)

### 2.1 Fix Landing App ESLint Errors (115 errors)

**Issue:** Landing app has 115 ESLint violations
**Impact:** Blocks production CI/CD, poor code quality
**Effort:** 3-4 days (auto-fix + manual fixes)
**Priority:** HIGH - Prevents deployment

#### Phase 1: Auto-Fixable Issues (1-2 hours)

**Files Affected:** 15+ components

**Steps:**
```bash
# Auto-fix what ESLint can fix
pnpm -C apps/landing lint:fix

# This should handle:
# - Unused imports (auto-remove)
# - Some formatting issues
# - Require() imports (may not auto-fix)

# Check how many remain
pnpm -C apps/landing lint 2>&1 | wc -l
```

**Expected Reduction:** ~40-50 errors auto-fixed

---

#### Phase 2: Unescaped HTML Entities (25+ errors)

**Error Pattern:**
```
react/no-unescaped-entities
  Unescaped quote character can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`
```

**Files with Most Issues:**
1. `pages/CoopManagerDashboard.tsx` (8 errors)
2. `components/ExitIntentModal.tsx` (4 errors)
3. `components/ContractDetailModal.tsx` (2 errors)

**Solution Approach:**
```jsx
// BEFORE (❌ ESLint error)
<p>She said "hello" to me</p>

// AFTER (✅ Fixed)
<p>She said &quot;hello&quot; to me</p>

// OR use single quotes in JSX
<p>She said 'hello' to me</p>

// OR use template literals
<p>{`She said "hello" to me`}</p>
```

**Implementation:**
```bash
# Find all unescaped entity issues
grep -r "can be escaped" $(find apps/landing -name "*.tsx") | head -20

# For each file, apply one of:
# 1. Use &quot; for double quotes
# 2. Use &apos; or &#39; for single quotes
# 3. Wrap in template literal if the string is dynamic
# 4. Use single quotes in attribute if needed
```

**Specific Files & Line Numbers:**
```
ContractDetailModal.tsx:158   - Single quote in text
ExitIntentModal.tsx:85,131    - Double quotes in text
CoopManagerDashboard.tsx:385,534 - Multiple double quotes
```

**Time:** ~1-2 hours for manual fixes

---

#### Phase 3: Any Type Usage (30+ errors)

**Error Pattern:**
```typescript
@typescript-eslint/no-explicit-any
  Unexpected any. Specify a different type
```

**Strategy:** Type API responses and component props

**Files with Most Issues:**
1. `pages/OfftakerDashboard.tsx` (6+ errors)
2. `components/EventLogForm.tsx` (3 errors)
3. `components/DashboardLayout.tsx` (2 errors)

**Solution Approach:**

**Step 1: Define TypeScript Interfaces**
```typescript
// Create or update types/index.ts

// BEFORE (❌ any type)
interface DashboardData {
  harvest: any;
  farmers: any;
  analytics: any;
}

// AFTER (✅ Properly typed)
interface HarvestData {
  id: string;
  volume: number;
  date: string;
  location: string;
}

interface FarmerData {
  id: string;
  name: string;
  coop: string;
  rating: number;
}

interface AnalyticsMetrics {
  totalYield: number;
  averageQuality: number;
  complianceScore: number;
}

interface DashboardData {
  harvest: HarvestData[];
  farmers: FarmerData[];
  analytics: AnalyticsMetrics;
}
```

**Step 2: Apply Types to Components**
```typescript
// EventLogForm.tsx BEFORE
const handleSubmit = (data: any) => { ... }

// EventLogForm.tsx AFTER
interface FormData {
  timestamp: string;
  eventType: string;
  location: string;
  details: string;
}

const handleSubmit = (data: FormData) => { ... }
```

**Specific Fixes Needed:**

| File | Line | Issue | Type |
|------|------|-------|------|
| `OfftakerDashboard.tsx` | 9,10,26,36,37,56 | `any` in useState | Define interface |
| `EventLogForm.tsx` | 65,73,91 | `any` in form handlers | Define FormData interface |
| `DashboardLayout.tsx` | 81 | `any` in render props | Define component prop type |
| `ContractDetailModal.tsx` | 5,57 | `any` in modal data | Define ModalData interface |
| `DashboardCharts.tsx` | 10 | `any` in chart data | Use Recharts typing |
| `analytics.ts` | 13 | `any` in analytics | Define analytics event type |
| `performance.ts` | 24 | `any` in performance metrics | Define metrics interface |
| `types/index.ts` | 7 | `any` in general types | Replace with specific types |

**Time:** ~2-3 hours

---

#### Phase 4: Unused Variables & Imports (20+ errors)

**Error Pattern:**
```
@typescript-eslint/no-unused-vars
  'variableName' is defined but never used
```

**Files with Issues:**
- `AdminComponents.tsx` - Unused `useState`
- `LoginPage.tsx` - Unused `isConnected`, `address`
- `OfftakerDashboard.tsx` - Unused `PerformanceBarChart`
- `ExitIntentModal.tsx` - Unused `handleWindowFocus`
- `FarmerOnboardingForm.tsx` - Unused `error`

**Solution:** Remove or fix

```typescript
// BEFORE
import { useState } from 'react';  // Unused
const AdminComponents = () => {
  // ... never uses useState
}

// AFTER - Remove import or use it
```

**Time:** ~30 minutes

---

#### Phase 5: Require Imports in ES Module (2 errors)

**File:** `apps/landing/tailwind.config.js`
**Lines:** 63-64

**Error:**
```
@typescript-eslint/no-require-imports
  A `require()` style import is forbidden
```

**Solution:**
```javascript
// BEFORE
const defaultTheme = require('tailwindcss/defaultConfig');

// AFTER
import defaultTheme from 'tailwindcss/defaultConfig.js';
```

**Time:** ~15 minutes

---

### 2.1 Summary - Landing App Linting

**Total Effort:** 3-4 days
**Work Breakdown:**
- Auto-fix: 1-2 hours
- HTML entities: 1-2 hours
- Any types: 2-3 hours
- Unused imports: 30 minutes
- Require imports: 15 minutes

**Verification:**
```bash
# After all fixes
pnpm -C apps/landing lint

# Expected output:
# No errors
# Build successful
```

---

### 2.2 Update Deprecated Dependencies

**Issue:** 18 deprecated subdependencies
**Impact:** Potential security issues, maintenance burden
**Effort:** 1-2 days
**Priority:** HIGH

#### Step 1: Identify Direct Dependencies

**Critical Deprecated Packages:**
- `@metamask/sdk` (v0.33.1) → update to latest
- `@walletconnect/*` (v2.21.x) → update to v2.22+
- `wagmi` (v2.x) → check for updates
- `viem` (v2.x) → check for updates

**Approach:**
```bash
# Check for updates
pnpm outdated | grep -E "metamask|walletconnect|wagmi|viem"

# Update specific packages
pnpm update @metamask/sdk -L  # Latest
pnpm update @walletconnect/ethereum-provider -L
```

**Files to Update:**
- `apps/landing/package.json` - dependencies
- `apps/backend/requirements.txt` - Python dependencies (check for outdated)

#### Step 2: Test After Updates

```bash
# Install dependencies
pnpm install

# Rebuild landing app
pnpm -C apps/landing build

# Run lint
pnpm -C apps/landing lint

# Check for breaking changes
pnpm -C apps/landing dev  # Start dev server, test functionality
```

#### Step 3: Python Dependency Updates (Backend)

**File:** `apps/backend/requirements.txt`

**Check for Updates:**
```bash
# In backend directory
pip list --outdated

# Update critical packages
pip install --upgrade django djangorestframework web3
```

**Time:** ~4-6 hours

---

## 3. MEDIUM PRIORITY ISSUES (Days 5-7)

### 3.1 Secure Environment Configuration

**Issue:** Secrets and project IDs in version control
**Impact:** Security vulnerability
**Effort:** 4-6 hours
**Priority:** MEDIUM - Important for production

#### Step 1: Remove Secrets from `.env.example`

**Current Issues:**
```
SANITY_PROJECT_ID=gevf0weh              # Hardcoded
CELO_PRIVATE_KEY=0x...                  # Placeholder but example too detailed
MPESA_CONSUMER_KEY=YOUR_KEY            # Placeholder but real in production
```

**Solution:**
```bash
# Create production-specific files
cp .env.example .env.production.example
cp .env.example .env.development.example

# Remove/mask secrets
# Keep only variable names and descriptions
```

**Updated `.env.example`:**
```
# ═══════════════════════════════════════════════════════════════════════
# BACKEND (apps/backend)
# ═══════════════════════════════════════════════════════════════════════
SECRET_KEY=<your-django-secret-key>
DEBUG=False  # Always False in production
ALLOWED_HOSTS=localhost,127.0.0.1  # Update for your domain

# Database - Use managed PostgreSQL in production
DATABASE_URL=<postgres-connection-string>

# Blockchain (Celo)
CELO_PRIVATE_KEY=<your-private-key>
CELO_RPC_URL=https://forno.celo-sepolia.celo-testnet.org
CELO_CHAIN_ID=11142220

# M-Pesa Daraja - Get from Safaricom
MPESA_ENV=production
MPESA_CONSUMER_KEY=<get-from-safaricom>
MPESA_CONSUMER_SECRET=<get-from-safaricom>
MPESA_SHORTCODE=<your-shortcode>

# CMS - Sanity Project (Get from Sanity)
SANITY_PROJECT_ID=<your-project-id>
SANITY_DATASET=production

# ═══════════════════════════════════════════════════════════════════════
# FRONTEND (apps/landing)
# ═══════════════════════════════════════════════════════════════════════
VITE_API_URL=https://api.yourdomain.com
VITE_SENTRY_DSN=<your-sentry-dsn>
VITE_SANITY_PROJECT_ID=<your-project-id>
VITE_SANITY_DATASET=production

# ═══════════════════════════════════════════════════════════════════════
# PROTOCOL (apps/protocol)
# ═══════════════════════════════════════════════════════════════════════
PRIVATE_KEY=<your-account-private-key>
CUSD_ADDRESS_MAINNET=0x765de816845861e75a25fca122bb6898b50b17fa  # Mainnet
```

**Time:** ~1 hour

#### Step 2: Document Secrets Management

**Create:** `docs/SECRETS_MANAGEMENT.md`

**Content:**
```markdown
# Secrets Management Guide

## GitHub Secrets
1. Go to repo Settings → Secrets and variables → Actions
2. Add environment-specific secrets:
   - PROD_DJANGO_SECRET_KEY
   - PROD_CELO_PRIVATE_KEY
   - PROD_DATABASE_URL
   - etc.

## Local Development
1. Copy .env.development.example to .env
2. Get values from team lead
3. Never commit .env file

## Production
1. Use GitHub Secrets or managed secrets service
2. Rotate keys every 90 days
3. Use different keys for staging/production
```

**Time:** ~1 hour

#### Step 3: Update CI/CD to Use Secrets

**Create:** `.github/workflows/deploy.yml`

**Add Environment Secrets:**
```yaml
env:
  SECRET_KEY: ${{ secrets.PROD_DJANGO_SECRET_KEY }}
  CELO_PRIVATE_KEY: ${{ secrets.PROD_CELO_PRIVATE_KEY }}
  DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
```

**Time:** ~2-3 hours

---

### 3.2 Add Type Safety Improvements

**Issue:** Excessive `any` type usage
**Impact:** Reduced IDE support, harder to catch bugs
**Effort:** 2-3 days
**Priority:** MEDIUM

**Comprehensive Type Definitions:**

**File:** `apps/landing/types/index.ts`

**Current Status:** Missing detailed interfaces

**What to Add:**

```typescript
// === User & Authentication ===
interface User {
  id: string;
  email: string;
  role: 'admin' | 'case_officer' | 'agronomist' | 'farmer' | 'offtaker' | 'field_agent' | 'coop_manager';
  name: string;
  coop?: string;
  createdAt: string;
}

// === Harvest Data ===
interface Harvest {
  id: string;
  farmerId: string;
  date: string;
  volume: number;
  quality: 'high' | 'medium' | 'low';
  location: {
    latitude: number;
    longitude: number;
  };
  verificationStatus: 'pending' | 'approved' | 'rejected';
  transactionHash?: string;
}

// === Dashboard Components ===
interface DashboardMetrics {
  totalHarvest: number;
  averageQuality: number;
  complianceScore: number;
  revenueEarned: number;
}

interface ChartDataPoint {
  name: string;
  value: number;
  timestamp: string;
}

// === API Responses ===
interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  message?: string;
}

interface ApiError {
  status: number;
  message: string;
  details?: Record<string, unknown>;
}

// === Blockchain ===
interface PayoutRecord {
  farmerId: string;
  amount: string;
  status: 'pending' | 'completed' | 'failed';
  transactionHash: string;
  timestamp: string;
}

// === Form Data ===
interface EventLogFormData {
  timestamp: string;
  eventType: string;
  location: string;
  details: string;
  photosUrls?: string[];
}

interface FarmerOnboardingData {
  name: string;
  email: string;
  phone: string;
  cooperativeId: string;
  walletAddress: string;
  farmSize: number;
  cropType: string;
}
```

**Time:** ~1 day to add and integrate all types

---

## 4. LOW PRIORITY ISSUES (Week 2)

### 4.1 Set Up Backend Test Suite

**Issue:** No tests for Django backend
**Impact:** Reduced confidence in API changes
**Effort:** 2-3 days
**Priority:** LOW (but important long-term)

**Setup:**

1. **Install Testing Dependencies**
```bash
cd apps/backend
pip install pytest pytest-django pytest-cov
```

2. **Create Test Configuration**
```
apps/backend/pytest.ini
apps/backend/conftest.py
```

3. **Sample Test Structure**
```
apps/backend/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── test_auth.py
│   ├── test_harvest.py
│   ├── test_users.py
│   └── test_blockchain.py
```

**Time:** ~2-3 days for basic setup + sample tests

---

### 4.2 Set Up Frontend Test Suite

**Issue:** No tests for React components
**Impact:** Risky refactoring, reduced reliability
**Effort:** 2-3 days
**Priority:** LOW (but important long-term)

**Setup:**

1. **Install Dependencies**
```bash
pnpm -C apps/landing add -D vitest @testing-library/react @testing-library/jest-dom
```

2. **Create Test Configuration**
```
apps/landing/vitest.config.ts
apps/landing/tests/setup.ts
```

3. **Sample Test Structure**
```
apps/landing/
├── __tests__/
│   ├── components/
│   │   ├── Dashboard.test.tsx
│   │   ├── MapComponent.test.tsx
│   │   └── EventLogForm.test.tsx
│   └── pages/
│       ├── LoginPage.test.tsx
│       └── Dashboard.test.tsx
```

**Time:** ~2-3 days for basic setup + sample tests

---

### 4.3 Add API Documentation

**Issue:** No OpenAPI/Swagger documentation
**Impact:** Harder for frontend to integrate
**Effort:** 2-3 days
**Priority:** LOW

**Setup:**

1. **Add drf-spectacular to Django**
```bash
pip install drf-spectacular
```

2. **Configure in settings.py**
```python
INSTALLED_APPS = [
    ...
    'drf_spectacular',
]

REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}
```

3. **Generate Swagger UI**
- Auto-generates from DRF viewsets
- Available at `/api/schema/swagger/`

**Time:** ~1 day for setup + documentation

---

## 5. DAILY TIMELINE

### Day 1 (Monday)
- **Morning:** Fix Protocol ESM/CJS (Issue 1.1) - 30 min
- **Rest:** Start Landing app linting (auto-fix phase)
- **Goal:** Get Protocol app building again

```bash
# Day 1 checklist
[ ] Fix apps/protocol/package.json (remove "type": "module")
[ ] Verify pnpm compile works
[ ] Verify pnpm test passes
[ ] Start eslint --fix on landing app
```

---

### Day 2 (Tuesday)
- **All day:** Fix Landing app unescaped HTML entities
- **Late:** Start typing API responses

```bash
# Day 2 checklist
[ ] Fix all 25+ HTML entity errors
[ ] Fix 2 require() imports in tailwind.config.js
[ ] Run lint and check progress
[ ] Define 5-6 core TypeScript interfaces
```

---

### Day 3 (Wednesday)
- **All day:** Complete `any` type replacements
- **Late:** Verify full build succeeds

```bash
# Day 3 checklist
[ ] Replace 30+ any types with proper interfaces
[ ] Test each component
[ ] Run full lint - should be clean
[ ] Run pnpm build to verify no regressions
```

---

### Day 4 (Thursday)
- **Morning:** Complete unused imports cleanup
- **Afternoon:** Update deprecated dependencies
- **Late:** Test web3 functionality

```bash
# Day 4 checklist
[ ] Remove remaining unused imports
[ ] Update @metamask/sdk and @walletconnect
[ ] Update other npm dependencies
[ ] Test landing app functionality locally
```

---

### Day 5 (Friday)
- **All day:** Secure environment configuration
- **Late:** Create security documentation

```bash
# Day 5 checklist
[ ] Create .env.production.example
[ ] Create docs/SECRETS_MANAGEMENT.md
[ ] Remove hardcoded IDs from docs
[ ] Document GitHub Secrets setup
```

---

### Days 6-7 (Weekend/Buffer)
- Start optional: Backend tests or Frontend tests
- Or: Polish and testing

```bash
# Day 6-7 optional tasks
[ ] Set up pytest for backend
[ ] Set up vitest for frontend
[ ] Add API documentation
[ ] Code review and polish
```

---

## 6. EXECUTION CHECKLIST

### Pre-Implementation
- [ ] Read this plan thoroughly
- [ ] Create feature branch: `git checkout -b fix/audit-issues`
- [ ] Backup current code: `git commit -am "Pre-fix backup"`

### Phase 1: Critical (Days 1-2)
- [ ] **1.1** Fix Protocol ESM/CJS config
- [ ] **1.2** Verify Protocol builds and tests pass
- [ ] Run full monorepo build: `pnpm -r build`

### Phase 2: High Priority (Days 2-5)
- [ ] **2.1a** Auto-fix landing linting issues
- [ ] **2.1b** Fix 25+ HTML entity errors
- [ ] **2.1c** Replace 30+ `any` types
- [ ] **2.1d** Remove unused imports/variables
- [ ] **2.1e** Fix require() imports
- [ ] Verify: `pnpm -r lint` passes
- [ ] **2.2** Update deprecated dependencies
- [ ] Test web3 functionality

### Phase 3: Medium Priority (Days 5-7)
- [ ] **3.1** Secure environment configuration
- [ ] **3.2** Add comprehensive type definitions
- [ ] Verify: Full TypeScript build passes

### Phase 4: Low Priority (Week 2, Optional)
- [ ] **4.1** Set up backend tests
- [ ] **4.2** Set up frontend tests
- [ ] **4.3** Add API documentation

### Final Verification
- [ ] All 13 protocol tests passing
- [ ] Zero linting errors
- [ ] Full monorepo build succeeds
- [ ] No TypeScript errors
- [ ] Local dev server works
- [ ] All dashboards load
- [ ] Wallet connection works

### Deployment
- [ ] Commit all fixes
- [ ] Create PR with summary
- [ ] Request code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] Deploy to production

---

## 7. RISK MITIGATION

### Potential Issues & Mitigations

**Issue 1: Breaking Changes in Updated Dependencies**
- Mitigation: Update one package at a time, test after each
- Rollback: Keep git commits, can revert individual updates

**Issue 2: Hardhat Config Doesn't Work**
- Mitigation: Test immediately after fix
- Fallback: Use Solution B (hardhat.config.cjs alternative)

**Issue 3: Unintended TypeScript Errors After Type Fixes**
- Mitigation: Add types incrementally, test after each
- Fallback: Keep some `any` types in non-critical areas temporarily

**Issue 4: Environment Secrets Leakage**
- Mitigation: Be extremely careful about what goes in version control
- Verification: Run `git log -p` to ensure no secrets in commits

---

## 8. SUCCESS CRITERIA

### Build Metrics
- [x] `pnpm -r build` completes without errors
- [x] `pnpm -r test` passes all tests
- [x] `pnpm -r lint` shows zero errors
- [x] `pnpm -r type-check` passes

### Code Quality
- [x] Zero TypeScript errors
- [x] Zero ESLint errors
- [x] <5% `any` type usage
- [x] >50% test coverage

### Functionality
- [x] All 13 smart contract tests passing
- [x] Dashboards load without errors
- [x] Wallet connection works
- [x] API integration successful

### Security
- [x] No secrets in version control
- [x] Environment configuration secure
- [x] Dependencies up to date
- [x] Security documentation complete

---

## 9. SUMMARY

| Phase | Task | Days | Effort | Status |
|-------|------|------|--------|--------|
| 1 | Fix Protocol ESM | 0.5 | 30 min | 🟥 Blocking |
| 1 | Verify Protocol | 0.5 | 15 min | 🟥 Blocking |
| 2 | Landing Linting | 3 | 12 hours | 🟠 High |
| 2 | Update Deps | 1 | 4-6 hours | 🟠 High |
| 3 | Secure Env | 1 | 4-6 hours | 🟡 Medium |
| 3 | Type Safety | 1.5 | 6-9 hours | 🟡 Medium |
| 4 | Backend Tests | Optional | 8-12 hours | 🟢 Low |
| 4 | Frontend Tests | Optional | 8-12 hours | 🟢 Low |
| 4 | API Docs | Optional | 4-6 hours | 🟢 Low |

**Total (Required):** 5-6 days
**Total (With Optional):** 7-10 days

---

**Next Step:** Start with Day 1 - Fix Protocol ESM/CJS configuration

Generated: March 30, 2026
