# Regression Test Suite

## Purpose

This directory contains regression tests for bugs that have been fixed. Each test ensures that the bug does not reappear in future code changes.

## Naming Convention

Test files should be named using this pattern:
```
bug-{issue-number}-{short-description}.test.ts
```

Examples:
- `bug-123-stripe-webhook-validation.test.ts`
- `bug-456-license-key-generation.test.ts`
- `edge-case-empty-course-modules.test.ts`

## Test Structure

Each regression test should include:

1. **Bug ID/Reference**: Link to the original issue
2. **Description**: What was the bug?
3. **Root Cause**: Why did it happen?
4. **Test Cases**: Specific scenarios that triggered the bug
5. **Expected Behavior**: What should happen now

## Template

```typescript
/**
 * Regression Test: Bug #{BUG_NUMBER}
 *
 * Bug Description:
 * [Describe what was broken]
 *
 * Root Cause:
 * [Why did it happen?]
 *
 * Fixed In:
 * Commit: {commit-hash}
 * Date: {YYYY-MM-DD}
 *
 * Test Coverage:
 * - [Specific scenario 1]
 * - [Specific scenario 2]
 * - [Edge case]
 */

describe("Bug #{BUG_NUMBER}: {Short Description}", () => {
  it("should not reproduce the original bug", () => {
    // Test code
  });

  it("should handle edge case that triggered the bug", () => {
    // Test code
  });
});
```

## Categories

### Authentication Bugs
- Password reset failures
- Session expiration issues
- Magic link validation

### Payment Bugs
- Stripe webhook signature validation
- Checkout session creation failures
- Subscription cancellation issues

### Data Integrity Bugs
- Foreign key constraint violations
- Race conditions in concurrent updates
- Orphaned records

### UI/UX Bugs
- Form validation edge cases
- Modal state management
- Navigation issues

## Running Regression Tests

```bash
# Run all regression tests
npm test -- __tests__/regression

# Run specific bug test
npm test -- bug-123

# Run with coverage
npm test -- --coverage __tests__/regression
```

## Adding New Regression Tests

When a bug is fixed:

1. Create a new test file in this directory
2. Follow the naming convention and template
3. Ensure the test fails before the fix (verify with git)
4. Ensure the test passes after the fix
5. Add a comment linking to the PR/issue
6. Update this README with the bug category if new
