# Frontend Tests

This directory contains tests for the Vunachain landing app using Vitest and React Testing Library.

## Structure

```
__tests__/
├── components/        # Component tests
├── types/             # Type and utility tests
├── pages/             # Page component tests (when added)
└── README.md          # This file
```

## Running Tests

From the `apps/landing` directory:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test -- --watch

# Run tests with UI
pnpm test:ui

# Run tests once (CI mode)
pnpm test:run

# Generate coverage report
pnpm test:coverage
```

## Test Examples

### Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### User Interaction Test

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<button onClick={handleClick}>Click</button>);

    await userEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what users see and do
   - Avoid testing internal state details

2. **Use Descriptive Test Names**
   ```typescript
   // ✓ Good
   it('should display error message when form submission fails', () => {});

   // ✗ Bad
   it('handles error', () => {});
   ```

3. **Use Arrange-Act-Assert Pattern**
   ```typescript
   it('should update count when button clicked', async () => {
     // Arrange
     render(<Counter initialValue={0} />);
     const button = screen.getByText('Increment');

     // Act
     await userEvent.click(button);

     // Assert
     expect(screen.getByText('Count: 1')).toBeInTheDocument();
   });
   ```

4. **Mock External Dependencies**
   ```typescript
   import { vi } from 'vitest';

   const mockApi = vi.fn().mockResolvedValue({ data: [] });
   ```

5. **Test Edge Cases**
   - Empty states
   - Loading states
   - Error states
   - Boundary conditions

## Coverage Goals

- Overall: 60%+ minimum
- Critical components: 80%+
- Page components: 70%+
- Utility functions: 90%+

Current coverage can be viewed in `htmlcov/index.html` after running `pnpm test:coverage`.

## Common Testing Patterns

### Testing Async Code

```typescript
it('should load data', async () => {
  render(<DataLoader />);

  // Wait for element to appear
  await screen.findByText('Data loaded');
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});
```

### Testing Forms

```typescript
it('should submit form with data', async () => {
  const handleSubmit = vi.fn();
  render(<Form onSubmit={handleSubmit} />);

  await userEvent.type(screen.getByLabelText('Name'), 'John');
  await userEvent.click(screen.getByText('Submit'));

  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ name: 'John' })
  );
});
```

### Testing Conditional Rendering

```typescript
it('should show content when user is logged in', () => {
  render(<ProtectedContent isLoggedIn={true} />);
  expect(screen.getByText('Secret Content')).toBeInTheDocument();
});

it('should hide content when user is logged out', () => {
  render(<ProtectedContent isLoggedIn={false} />);
  expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
});
```

## Debugging Tests

### Run Single Test
```bash
pnpm test -- Hero.test.tsx
```

### Watch Mode for Development
```bash
pnpm test -- --watch
```

### Debug in Browser
```bash
pnpm test -- --inspect
```

### Check What's Rendered
```typescript
import { render, screen } from '@testing-library/react';

it('should render component', () => {
  const { debug } = render(<MyComponent />);
  debug(); // Prints rendered HTML to console
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Adding New Tests

1. Create test file matching component location
   - Component: `components/Hero.tsx` → Test: `__tests__/components/Hero.test.tsx`

2. Import testing utilities
   ```typescript
   import { describe, it, expect, vi } from 'vitest';
   import { render, screen } from '@testing-library/react';
   ```

3. Write descriptive test cases

4. Run tests to verify they pass

5. Check coverage: `pnpm test:coverage`
