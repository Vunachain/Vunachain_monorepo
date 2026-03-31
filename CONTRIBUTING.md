# Contributing to Vunachain

Thank you for your interest in contributing to Vunachain! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Be respectful, inclusive, and professional. We're building a community around this project and expect all contributors to uphold high standards of conduct.

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Python 3.11 or later
- pnpm (for monorepo management)
- PostgreSQL 15+ (for backend)
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/vunachain/vunachain_monorepo.git
   cd vunachain_monorepo
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   pnpm install

   # Install backend dependencies
   cd apps/backend
   pip install -r requirements.txt
   ```

3. **Set up environment**
   ```bash
   # Backend
   cd apps/backend
   cp .env.development.example .env
   python manage.py migrate

   # Frontend (from project root)
   cd apps/landing
   cp .env.development.example .env
   ```

4. **Start development servers**
   ```bash
   # Terminal 1 - Backend (from apps/backend)
   python manage.py runserver

   # Terminal 2 - Frontend (from apps/landing)
   pnpm dev

   # Terminal 3 - Smart contracts (from apps/protocol, if testing)
   pnpm hardhat node  # In another terminal
   ```

Access the application:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/docs/

## Development Workflow

### Creating a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Use descriptive branch names:
- `feature/user-authentication` for new features
- `fix/login-error` for bug fixes
- `docs/api-guide` for documentation
- `refactor/database-schema` for refactoring
- `test/improve-coverage` for testing

### Making Changes

1. **Write Code**
   - Follow the project's code style (see Code Style section)
   - Write tests for new functionality
   - Keep commits atomic and well-documented

2. **Run Tests**
   ```bash
   # Backend tests
   cd apps/backend
   pytest --cov=. -v

   # Frontend tests
   cd apps/landing
   pnpm test

   # Smart contract tests
   cd apps/protocol
   pnpm test
   ```

3. **Lint and Format**
   ```bash
   # Frontend
   cd apps/landing
   pnpm lint:fix
   pnpm format

   # Backend (if using Black)
   cd apps/backend
   black . --line-length 100
   ```

4. **Type Check**
   ```bash
   # Frontend
   cd apps/landing
   pnpm type-check

   # Backend
   cd apps/backend
   mypy .
   ```

### Committing Changes

Write clear, descriptive commit messages following the Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that don't affect code meaning (formatting, etc.)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Code change that improves performance
- `test`: Adding or updating tests
- `chore`: Changes to build process, dependencies, etc.
- `ci`: Changes to CI configuration

Example:
```
feat(auth): implement token refresh mechanism

- Add refresh token endpoint
- Implement token rotation strategy
- Add refresh token storage in localStorage

Closes #123
```

### Creating a Pull Request

1. **Push your branch**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request on GitHub**
   - Use the provided PR template
   - Link related issues with "Closes #123"
   - Describe your changes clearly
   - Add screenshots if relevant

3. **Respond to Review Comments**
   - Address all feedback
   - Request re-review after making changes
   - Ask for clarification if feedback is unclear

## Code Style

### Frontend (React/TypeScript)

- Use functional components with hooks
- Use TypeScript for type safety
- Follow ESLint rules (enforced by `pnpm lint`)
- Use Prettier for formatting
- Component naming: PascalCase
- Variable/function naming: camelCase
- File structure:
  ```
  components/MyComponent/
  ├── MyComponent.tsx
  ├── MyComponent.test.tsx
  └── types.ts (if needed)
  ```

### Backend (Django/Python)

- Follow PEP 8 style guide
- Use type hints for function signatures
- Write docstrings for modules, classes, and functions
- Class naming: PascalCase
- Function/variable naming: snake_case
- Use Django ORM for database queries
- Avoid N+1 query problems with `select_related()` and `prefetch_related()`

### Smart Contracts (Solidity)

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use Hardhat for compilation and testing
- Include natspec comments for functions
- Use meaningful variable names

## Testing Requirements

### Frontend

- Minimum 60% code coverage
- Test critical user paths
- Test error states
- Use React Testing Library (not Enzyme)

```bash
pnpm test
pnpm test:coverage
```

### Backend

- Minimum 70% code coverage
- Test API endpoints
- Test model methods
- Test error handling
- Test permissions and authentication

```bash
cd apps/backend
pytest --cov=.
```

### Smart Contracts

- Minimum 90% code coverage
- Test all contract functions
- Test edge cases and error conditions
- Test contract interactions

```bash
cd apps/protocol
pnpm test
pnpm hardhat coverage
```

## Documentation

- Update relevant documentation files
- Add docstrings to new functions/classes
- Include examples for complex features
- Update CHANGELOG.md with significant changes

## Common Tasks

### Adding a New Dependency

**Frontend:**
```bash
cd apps/landing
pnpm add package-name
```

**Backend:**
```bash
cd apps/backend
pip install package-name
echo "package-name==version" >> requirements.txt
```

**Smart Contracts:**
```bash
cd apps/protocol
pnpm add package-name
```

### Updating Dependencies

```bash
# Check for updates
pnpm outdated

# Update packages
pnpm update
```

### Running All Tests

```bash
# From project root
pnpm test  # Frontend
cd apps/backend && pytest  # Backend
cd apps/protocol && pnpm test  # Smart contracts
```

## Project Structure

```
vunachain_monorepo/
├── apps/
│   ├── backend/          # Django REST API
│   │   ├── config/       # Django settings
│   │   ├── tests/        # Test suite
│   │   └── manage.py
│   ├── landing/          # React frontend
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── __tests__/    # Test files
│   │   └── package.json
│   └── protocol/         # Smart contracts
│       ├── contracts/    # Solidity files
│       ├── test/         # Contract tests
│       └── hardhat.config.cjs
├── packages/             # Shared packages
│   ├── config-eslint/
│   ├── config-prettier/
│   └── config-typescript/
├── docs/                 # Documentation
├── .github/
│   ├── workflows/        # CI/CD pipelines
│   └── ISSUE_TEMPLATE/   # Issue templates
└── package.json          # Root configuration
```

## Debugging

### Frontend

- Use React DevTools browser extension
- Use VS Code debugger
- Add `debugger;` statements
- Check browser console for errors

### Backend

- Use Django shell: `python manage.py shell`
- Use debugger: `import pdb; pdb.set_trace()`
- Check logs: `logs/` directory
- Use Django debug toolbar

### Smart Contracts

- Use Hardhat console: `npx hardhat console`
- Add console logs: `console.log()`
- Use Hardhat debugger

## Getting Help

- **Documentation**: Check `/docs` folder
- **Issues**: Search existing issues or create a new one
- **Discussions**: Use GitHub Discussions for questions
- **Slack/Discord**: Join our community (if applicable)

## Release Process

1. Update version in relevant `package.json` files
2. Update `CHANGELOG.md`
3. Create a release branch: `git checkout -b release/v1.0.0`
4. Create a pull request and get approval
5. Tag the release: `git tag v1.0.0`
6. Push tags: `git push origin v1.0.0`
7. Create GitHub release with changelog

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited for significant contributions

Thank you for contributing to Vunachain!

---

**Last Updated:** March 30, 2026
