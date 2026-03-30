# 🧪 Testing Guide

Comprehensive guide for running tests across the Vunachain monorepo.

---

## Quick Start

### Backend Tests
```bash
cd apps/backend

# Install test dependencies
pip install pytest pytest-django pytest-cov

# Run all tests
pytest

# Run with verbose output
pytest -v

# Run specific test file
pytest tests/test_api.py -v

# Run tests matching a pattern
pytest -k "test_create" -v
```

### Frontend Tests
```bash
cd apps/landing

# Run all tests
pnpm test

# Watch mode
pnpm test -- --watch

# UI Mode
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Coverage report
pnpm test:coverage
```

### Smart Contract Tests
```bash
cd apps/protocol

# Run all tests
pnpm test

# Run specific test file
pnpm test TraceabilityV2.test.ts

# Get coverage
pnpm hardhat coverage
```

---

## Backend Testing

### Setup

1. **Install dependencies:**
```bash
cd apps/backend
pip install -r requirements.txt
pip install pytest pytest-django pytest-cov
```

2. **Configure Django:**
```bash
python manage.py migrate
```

### Running Tests

**All tests:**
```bash
pytest
```

**Specific test file:**
```bash
pytest tests/test_api.py -v
```

**Tests matching pattern:**
```bash
pytest -k "farmer" -v
```

**Specific test class:**
```bash
pytest tests/test_api.py::TestFarmerEndpoints -v
```

**Specific test method:**
```bash
pytest tests/test_api.py::TestFarmerEndpoints::test_create_farmer -v
```

### Test Markers

Run tests by category:

```bash
# Run only API tests
pytest -m api -v

# Run only unit tests
pytest -m unit -v

# Run only integration tests
pytest -m integration -v

# Run only blockchain tests
pytest -m blockchain -v

# Skip slow tests
pytest -m "not slow" -v
```

### Coverage Report

```bash
# Generate coverage report
pytest --cov=. --cov-report=html

# Open HTML report
open htmlcov/index.html  # macOS
# or
firefox htmlcov/index.html  # Linux
```

**Coverage Goals:**
- Overall: 70% minimum
- Critical paths: 90%+
- API endpoints: 85%+
- Business logic: 80%+

### Test Structure

```
apps/backend/
├── tests/
│   ├── __init__.py
│   ├── test_api.py          # API endpoint tests
│   ├── test_auth.py         # Authentication tests
│   ├── test_blockchain.py   # Blockchain integration tests
│   ├── test_models.py       # Model tests
│   └── test_serializers.py  # Serializer tests
├── conftest.py              # Pytest fixtures and configuration
└── pytest.ini               # Pytest configuration
```

### Fixtures

Common fixtures available in `conftest.py`:

```python
# API client
def test_with_api_client(api_client):
    response = api_client.get('/api/farmers/')
    assert response.status_code == 200

# Authenticated API client
def test_authenticated_request(authenticated_api_client):
    response = authenticated_api_client.get('/api/user/profile/')
    assert response.status_code == 200

# Test user
def test_create_user(test_user):
    assert test_user.username == 'testuser'

# Test admin user
def test_admin_action(test_admin_user):
    assert test_admin_user.is_staff == True
```

### Writing Tests

**Test Template:**
```python
import pytest
from rest_framework import status

@pytest.mark.api
class TestYourEndpoint:
    """Test description."""

    def test_successful_request(self, authenticated_api_client, db):
        """Test description."""
        # Arrange
        test_data = {'name': 'test'}

        # Act
        response = authenticated_api_client.post('/api/endpoint/', test_data)

        # Assert
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()['name'] == 'test'
```

**Best Practices:**
- One assertion per test when possible
- Use descriptive test names
- Use arrange/act/assert pattern
- Mock external services
- Use fixtures for setup
- Clean up in teardown

---

## Frontend Testing

### Setup

Vitest is already configured with React Testing Library. Dependencies are in `package.json`.

```bash
cd apps/landing

# Install dependencies
pnpm install
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode (re-runs on file changes)
pnpm test -- --watch

# UI mode for interactive testing
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Generate coverage report
pnpm test:coverage

# Specific test file
pnpm test -- Hero.test.tsx

# Matching pattern
pnpm test -- --grep "Button"
```

### Configuration

- **Config File**: `vite.config.ts` (integrated with Vite)
- **Setup File**: `vitest.setup.ts` (global test setup)
- **Test Directory**: `__tests__/` (contains all test files)

### Test Structure

```
apps/landing/
├── __tests__/
│   ├── components/
│   │   ├── Hero.test.tsx       # Component tests
│   │   ├── Button.test.tsx     # Interactive component tests
│   │   └── Form.test.tsx       # Form component tests
│   ├── types/
│   │   └── validation.test.ts  # Type and utility tests
│   ├── pages/
│   │   ├── Dashboard.test.tsx  # Page component tests
│   │   └── Login.test.tsx      # Auth page tests
│   └── README.md               # Test documentation
├── components/                 # Source components
├── pages/                      # Source pages
├── vite.config.ts             # Vite + Vitest config
└── vitest.setup.ts            # Global test setup
```

### Example Component Test

```typescript
// __tests__/components/Button.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../../components/Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### Coverage Goals

- Overall: 60%+ minimum
- Critical components: 80%+
- Page components: 70%+
- Utility functions: 90%+

---

## Smart Contract Testing

### Running Tests

```bash
cd apps/protocol

# Run all tests
pnpm test

# Run specific test
pnpm test TraceabilityV2.test.ts

# Run with verbose output
pnpm test -- --reporter=verbose

# Generate coverage
pnpm hardhat coverage
```

### Test Structure

```
apps/protocol/
├── test/
│   ├── TraceabilityV2.test.ts
│   ├── SupplyEscrow.test.ts
│   └── fixtures/
│       └── deployFixture.ts
└── hardhat.config.cjs
```

### Example Contract Test

```typescript
// test/TraceabilityV2.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";

describe("TraceabilityV2", () => {
  it("Should log harvest", async () => {
    const [owner] = await ethers.getSigners();
    const contract = await deployFixture();

    const tx = await contract.logHarvest(
      owner.address,
      100,
      "GPS_LOCATION"
    );

    await expect(tx).to.emit(contract, "HarvestLogged");
  });
});
```

### Coverage Goals

- Smart contracts: 90%+ minimum
- Critical functions: 100%
- Edge cases: All tested

---

## CI/CD Testing

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - run: pip install -r apps/backend/requirements.txt pytest
      - run: pytest apps/backend/tests/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: pnpm install
      - run: pnpm -C apps/landing test

  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm -C apps/protocol test
```

---

## Debugging Tests

### Backend

```bash
# Run with print statements
pytest tests/test_api.py -v -s

# Run with Python debugger
pytest tests/test_api.py --pdb

# Show local variables on failure
pytest tests/test_api.py -l
```

### Frontend

```bash
# Run single test
pnpm test -- Hero.test.tsx

# Watch mode (re-runs on save)
pnpm test -- --watch

# Debug in browser
pnpm test -- --inspect
```

### Smart Contracts

```bash
# Run with verbose logs
pnpm hardhat test --verbose

# Show contract ABI errors
pnpm hardhat compile --verbose

# Debug with Hardhat console
npx hardhat console
```

---

## Common Issues

### Django Model Issues
```bash
# Reset database
rm db.sqlite3
python manage.py migrate

# Check migrations
python manage.py makemigrations --dry-run
```

### Module Import Errors
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### TypeScript Errors
```bash
# Clear build cache
pnpm -r clean
pnpm install

# Check types
pnpm type-check
```

---

## Testing Checklist

Before committing code:

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Coverage meets minimum (70%+ backend, 60%+ frontend, 90%+ contracts)
- [ ] No console errors or warnings
- [ ] Linting passes
- [ ] TypeScript compilation succeeds
- [ ] Manual testing of changes

Before merging to main:

- [ ] All CI/CD checks pass
- [ ] Code review approved
- [ ] Staging environment tests pass
- [ ] Documentation updated

Before production release:

- [ ] All tests pass on main
- [ ] Manual QA testing completed
- [ ] Smoke tests pass in staging
- [ ] Release notes prepared
- [ ] Rollback plan in place

---

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Django Testing](https://docs.djangoproject.com/en/4.2/topics/testing/)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Hardhat Testing](https://hardhat.org/hardhat-runner/docs/guides/testing-contracts)

---

**Last Updated:** March 30, 2026
