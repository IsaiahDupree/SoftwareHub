# Testing Guide

## Unit Tests (Jest)
```bash
npm run test              # Run all tests
npm run test -- --watch   # Watch mode
npm run test:coverage     # With coverage report
npm run test -- --testNamePattern="pattern"  # Specific test
```

## E2E Tests (Playwright)
```bash
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # Interactive UI mode
npx playwright test file.spec.ts  # Specific file
```

## Writing Tests

### Unit Tests
- Location: `__tests__/`
- Pattern: `describe/it` with descriptive names
- Mock external services (Stripe, Supabase) in test files

### E2E Tests
- Location: `e2e/`
- Use Playwright's `page` fixture
- Test real user flows

## Coverage
Minimum 50% coverage required.
