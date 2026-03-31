# 🔐 Secrets Management Guide

This document describes how Vunachain manages sensitive configuration and deployment credentials.

---

## 1. Local Development

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Vunachain/Vunachain_monorepo.git
   cd Vunachain_monorepo
   ```

2. **Create local environment file:**
   ```bash
   # For backend
   cp .env.development.example apps/backend/.env

   # For frontend
   cp .env.development.example apps/landing/.env

   # For protocol
   cp .env.development.example apps/protocol/.env
   ```

3. **Get secrets from team lead:**
   Contact your team lead to obtain:
   - Celo Alfajores private key (testnet)
   - Sanity project ID and dataset
   - M-Pesa sandbox credentials
   - Sentry development DSN (optional)

4. **Fill in the .env files:**
   ```bash
   # Edit apps/backend/.env
   vim apps/backend/.env

   # Edit apps/landing/.env
   vim apps/landing/.env

   # Edit apps/protocol/.env
   vim apps/protocol/.env
   ```

### .env File Security

⚠️ **CRITICAL: Never commit .env files**

The `.env` files are listed in `.gitignore` and should never be committed:
```bash
# Verify they're ignored
git status | grep ".env"  # Should return nothing
```

If you accidentally committed secrets:
```bash
# Remove from git history (DANGEROUS - talk to team lead first)
git filter-branch --tree-filter 'rm -f .env' -- --all
```

---

## 2. GitHub Secrets (CI/CD)

### Setting Up Secrets

1. **Go to repository settings:**
   - Navigate to: `Settings → Secrets and variables → Actions`

2. **Create environment-specific secrets:**

   **Production Secrets:**
   ```
   PROD_DJANGO_SECRET_KEY         # 256+ character random string
   PROD_DEBUG                      # False
   PROD_ALLOWED_HOSTS             # yourdomain.com,api.yourdomain.com
   PROD_DATABASE_URL              # postgres://user:pass@host:5432/db
   PROD_CELO_PRIVATE_KEY          # Mainnet account private key
   PROD_CELO_RPC_URL              # https://forno.celo.org
   PROD_MPESA_CONSUMER_KEY        # From Safaricom
   PROD_MPESA_CONSUMER_SECRET     # From Safaricom
   PROD_SANITY_PROJECT_ID         # From Sanity
   PROD_SENTRY_DSN               # From Sentry
   PROD_CUSD_ADDRESS_MAINNET      # 0x765de816845861e75a25fca122bb6898b50b17fa
   ```

   **Staging Secrets:**
   ```
   STAGING_DJANGO_SECRET_KEY
   STAGING_DEBUG                   # False (in staging)
   STAGING_DATABASE_URL
   STAGING_CELO_PRIVATE_KEY       # Testnet account
   STAGING_CELO_RPC_URL           # https://alfajores-forno.celo-testnet.org
   # ... other staging values
   ```

3. **Use in GitHub Actions workflow:**

   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Production

   on:
     push:
       branches: [main]

   env:
     DJANGO_SECRET_KEY: ${{ secrets.PROD_DJANGO_SECRET_KEY }}
     DEBUG: ${{ secrets.PROD_DEBUG }}
     ALLOWED_HOSTS: ${{ secrets.PROD_ALLOWED_HOSTS }}
     DATABASE_URL: ${{ secrets.PROD_DATABASE_URL }}
     CELO_PRIVATE_KEY: ${{ secrets.PROD_CELO_PRIVATE_KEY }}

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Deploy to production
           run: |
             # Your deployment commands
   ```

---

## 3. Third-Party Service Secrets

### Celo Blockchain

**Mainnet Account Setup:**
1. Create a Celo account on mainnet: https://celo.org
2. Fund the account with CELO or cUSD
3. Backup the private key in a secure location (hardware wallet recommended)
4. Use the private key in GitHub Secrets and production environment

**Testnet Account Setup (Development):**
1. Get testnet cUSD from: https://celo.org/developers/faucet
2. Use for testing smart contracts

### Sanity CMS

**Getting Credentials:**
1. Go to: https://sanity.io/manage
2. Select your project
3. Get Project ID from project settings
4. Create API tokens: https://www.sanity.io/manage/personal/api-tokens
   - Create a token with read/write access
   - Save the token in GitHub Secrets

### M-Pesa Daraja

**Sandbox Credentials:**
1. Register at: https://developer.safaricom.co.ke
2. Get Consumer Key and Consumer Secret
3. Use endpoint: `https://sandbox.safaricom.co.ke`

**Production Credentials:**
1. Contact Safaricom for production access
2. Get production Consumer Key and Consumer Secret
3. Use endpoint: `https://api.safaricom.co.ke`

### Sentry Error Tracking

**Setup:**
1. Create account at: https://sentry.io
2. Create projects for frontend and backend
3. Get DSN for each project
4. Add to GitHub Secrets

---

## 4. Key Rotation

### Schedule

- **Django SECRET_KEY:** Every 90 days
- **Celo Private Keys:** Every 6 months (or if compromised)
- **M-Pesa Credentials:** As directed by Safaricom (typically annually)
- **API Tokens:** Every 12 months

### Process

1. **Generate new secret:**
   ```bash
   # Django SECRET_KEY
   python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
   ```

2. **Update GitHub Secrets:**
   - Go to Settings → Secrets and variables → Actions
   - Update the secret value
   - Note the rotation date

3. **Update deployed services:**
   - Railway (Backend): Update environment variables, redeploy
   - Vercel (Frontend): Update environment variables, redeploy
   - Smart Contracts: Deploy new contracts if needed

4. **Document the rotation:**
   ```
   # ROTATION LOG
   - Date: 2026-03-30
   - Secret: PROD_DJANGO_SECRET_KEY
   - Updated by: [Your Name]
   - Services affected: Backend (Railway)
   ```

---

## 5. Secure Practices

### ✅ DO

- ✅ Use strong, randomly generated secrets (24+ characters)
- ✅ Use different secrets for dev/staging/production
- ✅ Store secrets in GitHub Secrets, not in code or .env files
- ✅ Use environment-specific prefixes (PROD_, STAGING_, DEV_)
- ✅ Rotate secrets regularly (see rotation schedule above)
- ✅ Document who has access to which secrets
- ✅ Use hardware wallets for blockchain keys when possible
- ✅ Enable 2FA on GitHub, Sanity, Safaricom accounts
- ✅ Use least-privilege principles (API tokens with minimal scopes)

### ❌ DON'T

- ❌ Commit .env files or secrets to git
- ❌ Share secrets in Slack, email, or unencrypted channels
- ❌ Use the same secret across environments
- ❌ Log sensitive data (PII, keys, tokens)
- ❌ Hardcode secrets in source code
- ❌ Use weak passwords (< 16 characters)
- ❌ Share access credentials with team members
- ❌ Store backups of secrets in regular files
- ❌ Reuse old secrets after rotation

---

## 6. Incident Response

### If Secrets Are Compromised

1. **Immediate Actions (First Hour):**
   ```bash
   # 1. Alert team lead and security team immediately

   # 2. Revoke the compromised secret
   # (Remove from GitHub Secrets, update deployed services)

   # 3. Generate new secret
   # (Use secure generation method)

   # 4. Update all services
   # (GitHub, Railway, Vercel, Sanity, Safaricom, etc.)
   ```

2. **Investigation (Next 24 Hours):**
   - Check git history for any leaks: `git log -p | grep -i "secret\|password\|key"`
   - Review GitHub Actions logs for exposed values
   - Check external systems (Sentry, Sanity) for access logs
   - Determine scope of compromise

3. **Remediation (Next 72 Hours):**
   - Filter compromised secrets from git history if needed
   - Audit all services with access to compromised secret
   - Implement additional monitoring/alerting
   - Document incident and lessons learned

4. **Prevention (Ongoing):**
   - Use git hooks to prevent secret commits: `git secrets`
   - Enable GitHub Advanced Security (secret scanning)
   - Use branch protection rules to require code review
   - Implement SAST scanning in CI/CD

---

## 7. Tools

### Git Hooks (Prevent Accidental Commits)

**Install git-secrets:**
```bash
# macOS
brew install git-secrets

# Linux
git clone https://github.com/awslabs/git-secrets.git
cd git-secrets && make install

# Windows
# Use GitHub: https://github.com/awslabs/git-secrets
```

**Configure for Vunachain:**
```bash
cd /path/to/vunachain_monorepo

# Install hooks
git secrets --install -f

# Add patterns to detect secrets
git secrets --register-aws
git secrets --add 'PRIVATE_KEY=0x'
git secrets --add 'CELO_PRIVATE_KEY='
git secrets --add 'SECRET_KEY='
git secrets --add 'MPESA_CONSUMER_'

# Run scan on repository
git secrets --scan -r
```

### GitHub Secret Scanning

1. Go to: `Settings → Security & analysis → Secret scanning`
2. Enable "Push protection" to block commits with secrets
3. Review any detected secrets in the alerts

---

## 8. Access Control

### Who Has Access?

| Role | Dev | Staging | Production |
|------|-----|---------|------------|
| **Frontend Dev** | All dev secrets | None | None |
| **Backend Dev** | All dev secrets | None | None |
| **DevOps/SRE** | All | All | All |
| **Team Lead** | All | All | All |
| **Contractor** | Limited dev secrets | None | None |

### GitHub Teams

Create teams with limited access:
```
- vunachain-devs (development secrets only)
- vunachain-devops (all secrets)
- vunachain-lead (all secrets)
```

---

## 9. Backup & Recovery

### Backup Strategy

⚠️ **CRITICAL:** Private keys and secrets should have redundant backups

1. **Hardware Wallet Backup:**
   - Celo private key → Hardware wallet (Ledger/Trezor)
   - Physical backup → Secure vault

2. **Encrypted Digital Backup:**
   - Bitwarden/1Password vault shared with team lead
   - Encrypted Google Drive/Dropbox (with 2FA)

3. **Emergency Contact:**
   - Document emergency access procedure
   - Store with legal team

### Recovery Procedure

If production is down and secrets are needed:
1. Contact team lead
2. Verify identity (video call with 2FA)
3. Retrieve encrypted backup
4. Deploy emergency fix
5. Document and review

---

## References

- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitHub Documentation: Using secrets in workflows](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [Celo Documentation: Accounts & Keys](https://docs.celo.org/learn/celo-overview)
- [Sanity Documentation: API Authentication](https://www.sanity.io/docs/authentication)

---

**Last Updated:** March 30, 2026
**Next Review:** June 30, 2026
