# Test Coverage Report Configuration

## Overview
This document describes the test coverage configuration and reporting for SoftwareHub.

## Coverage Thresholds

### Unit Tests (Jest)
- **Branches:** 50%
- **Functions:** 50%
- **Lines:** 50%
- **Statements:** 50%

### Configuration
Coverage is configured in `jest.config.js`:

```javascript
collectCoverageFrom: [
  "lib/**/*.{js,ts}",
  "components/**/*.{js,ts,tsx}",
  "app/**/*.{js,ts,tsx}",
  "!**/*.d.ts",
  "!**/node_modules/**",
],
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

## Running Coverage Reports

### Unit Test Coverage
```bash
npm run test:coverage
```

This will:
1. Run all Jest tests
2. Generate coverage statistics
3. Create HTML report in `coverage/` directory
4. Display summary in terminal

### View HTML Report
```bash
open coverage/lcov-report/index.html
```

### E2E Test Report
```bash
npm run test:e2e
```

This will:
1. Run all Playwright tests
2. Generate HTML report in `playwright-report/` directory

View E2E report:
```bash
npx playwright show-report
```

## Coverage Report Formats

### Terminal Output
```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   75.23 |    68.45 |   70.12 |   75.89 |
 lib/                 |   82.34 |    75.22 |   78.90 |   82.45 |
  supabase.ts         |   95.00 |    85.00 |   90.00 |   95.00 | 45,67
 components/          |   68.12 |    61.78 |   65.45 |   68.23 |
  Button.tsx          |   80.00 |    70.00 |   75.00 |   80.00 | 23,45,67
----------------------|---------|----------|---------|---------|-------------------
```

### HTML Report
- **Location:** `coverage/lcov-report/index.html`
- **Features:**
  - Interactive file tree
  - Line-by-line coverage highlighting
  - Uncovered line numbers
  - Branch coverage details
  - Sortable columns

### LCOV Format
- **Location:** `coverage/lcov.info`
- **Usage:** CI/CD integration, coverage badges

## Coverage by Directory

### High Priority (>70% target)
- `lib/` - Core business logic
- `lib/entitlements/` - Access control
- `lib/stripe.ts` - Payment processing
- `lib/supabase/` - Database clients

### Medium Priority (>50% target)
- `components/` - React components
- `app/api/` - API routes
- `lib/utils/` - Utility functions

### Lower Priority
- `app/` - Page components (tested via E2E)
- `components/ui/` - UI primitives (tested via E2E)

## Excluded from Coverage

The following are excluded from coverage requirements:
- Type definition files (`.d.ts`)
- Configuration files
- Node modules
- Build output (`.next/`)
- E2E tests (`e2e/`)

## Increasing Coverage

### Finding Uncovered Code
```bash
npm run test:coverage -- --verbose
```

### Testing Specific Files
```bash
npm run test:coverage -- lib/entitlements/hasAccess.test.ts
```

### Watch Mode with Coverage
```bash
npm run test:coverage -- --watch
```

## CI/CD Integration

Coverage is checked on every CI run:
```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Coverage Badges

Add coverage badge to README:
```markdown
[![Coverage](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

## Best Practices

### Writing Testable Code
1. Keep functions small and focused
2. Inject dependencies
3. Avoid side effects
4. Use pure functions when possible

### Coverage Tips
- Don't aim for 100% - diminishing returns
- Focus on critical paths (auth, payments, entitlements)
- Test edge cases and error handling
- Mock external dependencies

### Maintaining Coverage
- Run coverage before committing
- Fix failing tests immediately
- Add tests for new features
- Review uncovered lines regularly

## Coverage Reports Location

### Unit Tests (Jest)
- **HTML Report:** `coverage/lcov-report/index.html`
- **JSON Report:** `coverage/coverage-final.json`
- **LCOV Report:** `coverage/lcov.info`
- **Text Summary:** Terminal output

### E2E Tests (Playwright)
- **HTML Report:** `playwright-report/index.html`
- **Traces:** `test-results/`
- **Screenshots:** `test-results/**/*-failed-*.png`

## Quick Commands

```bash
# Generate and view coverage
npm run test:coverage && open coverage/lcov-report/index.html

# Coverage for specific directory
npm run test:coverage -- lib/

# Coverage with verbose output
npm run test:coverage -- --verbose

# E2E report
npm run test:e2e && npx playwright show-report
```

## Troubleshooting

### Coverage Not Generated
- Ensure tests are running: `npm run test`
- Check `jest.config.js` is present
- Verify `collectCoverageFrom` paths are correct

### Low Coverage
- Run `npm run test:coverage -- --verbose` to see uncovered lines
- Focus on critical paths first
- Add tests for high-value functions

### HTML Report Not Opening
```bash
# macOS
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html

# Windows
start coverage/lcov-report/index.html
```

## Related Documentation
- [TDD Test Suite](./TDD_TEST_SUITE.md)
- [Jest Configuration](../jest.config.js)
- [Playwright Configuration](../playwright.config.ts)
