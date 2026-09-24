# Vunachain Monorepo — Full Audit Report

**Auditor:** Chief of Staff (Hermes Agent)
**Date:** September 24, 2026
**Repo:** `Vunachain/Vunachain_monorepo`
**Baseline:** `PROJECT_AUDIT.md` (March 30, 2026) — re-validated against current HEAD

---

## 1. Build & CI Status

### Current State (re-validated)

| Component | Build | Test | Lint | Deploy | |
|-----------|-------|------|------|--------|-|
| Protocol | ✅ `hardhat compile` | ✅ 13/13 Hardhat | ✅ ESLint v9 | ⚠️ Mainnet unverified | **Healthy** |
| Landing | ✅ Vite build (~16s) | ✅ Vitest + Cypress E2E | ❌ ~40 errors | ✅ Vercel (`vunachain.com`) | **Lint debt** |
| CMS | ✅ Sanity build (~2.2s) | ⚠️ None | ✅ Clean | ✅ Sanity Studio | **Healthy** |
| Backend | ✅ Django + Gunicorn | ✅ pytest (CI) | N/A | ✅ Railway | **Healthy** |

### CI: `.github/workflows/test.yml`

Four jobs + all-pass gate:

- **`backend-tests`** — Python 3.11, Postgres 15 service, pytest with coverage. **Working.**
- **`frontend-tests`** — Node 20, pnpm 8, lint + type-check + vitest `--coverage`. **Lint step fails** with ~40 errors; coverage upload has `fail_ci_if_error: false` but the lint step does not — so the job should be red on any landing PR with lint debt.
- **`smart-contract-tests`** — Node 20, pnpm, `hardhat compile` + `test` + `coverage`. **Working.** 13/13 passing.
- **`code-quality`** — lint (landing), type-check (landing), format check (all), compile (protocol). **Lint step fails.**

The `all-tests-pass` gate checks all four jobs. In practice, landing PRs that touch lint-sensitive files will fail CI.

### Protocol build (Issue 1.1 from March audit) — **RESOLVED**

`hardhat.config.ts` was renamed to `hardhat.config.cjs`. The config correctly uses `require()`. `package.json` still has `"type": "module"` but the `.cjs` extension exempts the config from that. Compilation produces 17 Solidity files, 60 TypeChain typings, zero warnings. 13/13 tests pass:

- Access Control & Initialization (2)
- Harvest Logging (3)
- Harvest Verification (3)
- Payouts (1)
- Batch Merkle Payouts (2)
- Signature verification (2)

### Landing lint debt (Issue 1.2 from March audit) — **PARTIALLY RESOLVED, STILL BLOCKING CI**

Down from 115 to ~40 errors, but still failing. Categories:

| Category | Count (approx) | Auto-fixable |
|----------|---------------|--------------|
| Unescaped HTML entities (`react/no-unescaped-entities`) | ~15 | Yes — `&quot;`, `&apos;` |
| `any` types (`@typescript-eslint/no-explicit-any`) | ~15 | No — requires typed interfaces |
| Unused imports / variables (`no-unused-vars`) | ~8 | Yes — `eslint --fix` |
| `require()` in `tailwind.config.js` (ES module context) | 2 | Yes — convert to `import` |

Files most affected: `ContractDetailModal.tsx`, `DashboardCharts.tsx`, `DashboardLayout.tsx`, `EventLogForm.tsx`, `OfftakerDashboard.tsx`, `AdminComponents.tsx`, `DemoModal.tsx`, `utils/analytics.ts`, `utils/performance.ts`, `types/index.ts`.

---

## 2. Code Quality

### Type safety (Issue 3.1) — **STILL PRESENT**

Widespread `any` in:
- `utils/analytics.ts` — API response handling
- `utils/performance.ts` — monitoring payloads
- `types/index.ts` — shared type definitions
- Dashboard components — `useState<any>(null)` patterns

New code should be typed. The existing `any` usage is intentional flexibility that erodes IDE support and compile-time checking.

### Unused code (Issue 3.2) — **STILL PRESENT**

- `AdminComponents.tsx` — unused `useState`
- `LoginPage.tsx` — unused `isConnected`, `address`, `openChainModal`
- `OfftakerDashboard.tsx` — unused `PerformanceBarChart` import
- Various unused error handlers and function parameters

Auto-fixable via `eslint --fix` for imports; dead code paths need manual review.

### Documentation

**Good:** `README.md`, `PROJECT_AUDIT.md`, `HARDENING_SUMMARY.md`, `FINAL_STATUS.md`, `VERIFICATION_SUMMARY.md`, `BEFORE_AFTER_SUMMARY.md`, `MONOREPO_CHECKLIST.md`, `STAGING_DEPLOYMENT_GUIDE.md`, `FINAL_CHECKLIST.md`, `DOCUMENTATION_INDEX.md`, `docs/` (API doc, testing guide, secrets management, Docker deployment, dependency updates).

**Missing:** No ADRs. No `CONTEXT.md` (ubiquitous language). No API reference that's actually maintained (the `docs/API_DOCUMENTATION.md` exists but may be stale). No smart contract deployment guide for mainnet. No incident response runbook.

The repo has a lot of *reports* but no *decision records*. When someone asks "why Solidity 0.8.20?" or "why Celo and not another L2?", there's no written answer.

---

## 3. Security

### Good practices

- OpenZeppelin 5.4 contracts (audited library)
- Meta-transaction relayer pattern (gas optimization + farmer UX)
- Merkle proof verification for batch payouts
- Django security middleware, CORS, JWT (SimpleJWT), Sentry
- RainbowKit / wagmi / viem for wallet integration (audited stack)
- CSP headers configured in `index.html`
- Environment-based secrets

### Concerns

- `.env.example` contains the **real** Sanity project ID `7iqshxb6` — also used as fallback in `lib/sanity.ts:7`. Not a credential by itself (Sanity project IDs are public), but signals that example files aren't treated as scrubbed templates. M-Pesa placeholders in the same file are correctly marked as placeholders — inconsistent pattern.
- No documented secrets rotation policy.
- No SAST scanning (GitHub CodeQL not configured).
- `SECRET_KEY` example is marked "insecure" — correct, but no production guidance next to it.
- Deprecated web3 dependencies (~18 transitive, mostly MetaMask SDK / WalletConnect) — low runtime impact, but plan an update.

---

## 4. Protocol Smart Contracts

**Contracts:** `TraceabilityV2.sol` (main, meta-tx support), `Traceability.sol` (legacy), `SupplyEscrow.sol` (payment holding), `ERC20Mock.sol` (testing).

**Features implemented:**
- Relayer meta-transaction pattern ✅
- Harvest logging and verification ✅
- Batch Merkle tree payouts ✅
- Admin access control ✅
- cUSD integration (Celo testnet) ✅
- Alfajores + Celo mainnet configured in `hardhat.config.cjs` ✅

**Gap:** No deploy script, no mainnet verification, no record of a mainnet deployment. The README claim "Mainnet ready (pending configuration)" has been true since March. For a platform whose pitch is "on-chain traceability", mainnet contract provenance is an empty claim until deployed and verified on Celo block explorer.

**Test coverage:** 13/13 passing, but only for `TraceabilityV2`. `SupplyEscrow` has no test file visible.

---

## 5. Landing Page — Messaging Audit

### What the page currently says

**Hero:** "Turn Global Compliance Into Your Strongest Asset." / "Stop viewing regulations as a roadblock. Vunachain transforms complex compliance into a competitive edge..."

**Nav:** Insights / Challenges / Technology / ROI

**Trust bar:** Celo / KEPSA / KAM / EUDR Ready

**Problem section:** "The 'Hidden Tax' on Your Operations." — 3 pain points: 25% Input Loss (financing), Global Market Access (EUDR/Rotterdam), Regulatory Friction (Tea Act 2020).

**Feature spotlight:** 2 features — "We see what brokers hope you miss" (satellite) and "Financial Security, Guaranteed by Code" (smart contracts).

**How it works:** 3 steps — Map the Source / Trace the Journey / Verify Compliance

**ROI calculator:** Procurement volume + credit per farmer → estimated loss + recoverable profit.

**Benefits:** Testimonial + 4 compliance badges (ISO 27001, Tea Act 2020, GDPR/Kenya DPA, Carbon-Neutral Infra).

**Footer CTA:** "Secure Your Next Harvest." / "Onboard your first 100 farmers in under 48 hours."

### What's wrong

**1. The page doesn't decide who it's talking to.**

The hero, problem section, ROI calculator, and footer CTA all speak to a **cooperative manager or aggregator** — input finance, side-selling, farmer onboarding, M-Pesa payouts. But the trust bar, feature spotlight, and compliance badges speak to an **export compliance director** — EUDR, Rotterdam rejection, ISO 27001, GDPR.

A cooperative manager and an export compliance director have different jobs, different fears, and different reasons to buy. The page gives both of them the same content and neither of them a clear "this is for me" signal.

**2. The hero headline is a category claim, not a value proposition.**

"Turn Global Compliance Into Your Strongest Asset" is the kind of line that sounds good in a boardroom and means nothing to someone deciding whether to book a demo. It doesn't say what Vunachain *does*, who it's for, or what happens if you don't use it.

**3. The trust bar leads with the wrong things.**

For a European buyer or compliance director, "Celo blockchain" and "KEPSA member" are noise. "EUDR Ready" is the signal — and it's fourth. Reorder so the compliance outcome comes first, and clarify what KEPSA/KAM represent (partnerships? endorsements? membership?).

**4. The problem section mixes audiences.**

"25% Input Loss" is a cooperative/financier problem. "Your entire container rejected at Rotterdam" is an exporter problem. "Manual data management for the Tea Act 2020" is both, but framed differently for each. Putting them in one equal-weight grid without signaling which is primary leaves both audiences unsure.

**5. FeatureSpotlight shows only 2 of 5+ capabilities.**

The platform does satellite monitoring, blockchain traceability, smart contract escrow, M-Pesa payments, and compliance reporting. The feature section shows satellite + escrow and calls it a day. A visitor who wants to know "does this do payments?" or "does this generate EUDR reports?" has to scroll to the dashboards (which are hidden in production) or book a demo to find out.

**6. The ROI calculator is credible as a hook, not as a number.**

The formula (`(volume * 1000) + (credit * 200) * cropFactor * 0.7`) is opaque and the defaults are arbitrary. It earns a click on "Get Full Report" but doesn't earn trust in the numbers. That's fine for a lead magnet but the copy should frame it as an estimate, not a calculation.

**7. The testimonial is long and anonymous.**

"Compliance isn't just about avoiding fines; it's about securing your future..." is true but generic. "Export Compliance Director, Leading Tea Exporter" doesn't build confidence — which exporter? What happened when they used Vunachain?

---

## 6. Recommendations (prioritized)

### P1 — Restructure landing page around one primary audience

Pick **cooperative managers / aggregators** as primary (the audience for "onboard 100 farmers in 48 hours" and the ROI calculator), and make the EUDR/export angle a secondary path via nav link or a dedicated section that leads with "Ship to Europe with Proof, Not Promises."

Every section should answer one of: what does Vunachain do, why does it matter, how does it work, what's the proof, what do I do next. The hero should say this in one glance.

### P2 — Fix landing lint to zero

Run `pnpm -C apps/landing lint:fix` for the auto-fixable subset, then manually fix HTML entities and `any` types. Target: green `code-quality` and `frontend-tests` CI jobs. This unblocks PRs and clears the largest remaining tech debt.

### P3 — Deploy and verify protocol on Celo mainnet

Add a deploy script, deploy `TraceabilityV2` to Celo mainnet, verify on Celo block explorer, and update the README to link to the verified contract. This turns "mainnet ready (pending configuration)" from a claim into a fact.

### P4 — Create `CONTEXT.md` + first ADR

Document the ubiquitous language (EUDR, Tea Act 2020, relayer, meta-transaction, Merkle payout, cUSD, Alfajores, offtaker, coop manager, field agent, agronomist, case officer). Write one ADR for the Solidity 0.8.20 + Celo choice. This pays off every time a new agent or developer joins the repo.

### P5 — Scrub `.env.example`

Remove the real Sanity project ID. Make all entries clearly placeholder. Consistent with how M-Pesa credentials are already handled.

### P6 — Expand FeatureSpotlight to cover the full platform

Add smart contract escrow, M-Pesa payments, and compliance reporting as visible features. Keep satellite + blockchain, but show the full scope so a visitor can answer "does this do what I need?" without booking a demo.

### P7 — Add `SupplyEscrow` tests

`TraceabilityV2` has 13/13. `SupplyEscrow.sol` has no test file. Add at least access control + deposit + release tests.

---

## 7. What's Working Well

- Monorepo structure is clean and conventional (apps + packages, pnpm + Turborepo).
- Protocol contracts are well-structured and tested. 13/13 green.
- Backend has the right Django stack (GeoDjango, DRF, JWT, Sentry, drf-spectacular).
- CI is real and multi-job, not a stub.
- Both production deployments exist and are live (Vercel + Railway).
- The landing page visual design is polished: dark mode, framer-motion, hero canvas animation, material symbols, responsive Tailwind. It looks like a real product site, not a template.
- Sanity CMS integration is clean — landing page content is editable without code deploys.

---

*End of audit. See attached landing page redesign.*
