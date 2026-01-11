# Testing Documentation

## Overview

This project uses **Vitest** for unit testing and **Playwright** for end-to-end (E2E) testing.

## Quick Start

```bash
# Install dependencies (if not already done)
npm install

# Install Playwright browsers
npm run playwright:install

# Run all unit tests
npm run test:run

# Run unit tests in watch mode
npm test

# Run E2E tests
npm run test:e2e
```

## Test Scripts

| Command | Description |
|---------|-------------|
| `npm test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:coverage` | Run unit tests with coverage report |
| `npm run test:ui` | Open Vitest UI (interactive test runner) |
| `npm run test:e2e` | Run E2E tests in all browsers |
| `npm run test:e2e:ui` | Open Playwright UI for debugging |
| `npm run test:e2e:headed` | Run E2E tests with visible browser |
| `npm run test:e2e:chromium` | Run E2E tests in Chromium only |
| `npm run playwright:install` | Install Playwright browsers |

## Test Structure

```
tests/
├── setup.ts              # Test setup, mocks for Firebase
├── unit/
│   └── lib/
│       ├── albums.test.ts      # Album/Workbook library tests
│       ├── auth.test.ts        # Authentication library tests
│       ├── gradebook.test.ts   # Gradebook library tests
│       └── validation.test.ts  # Input validation tests
└── e2e/
    ├── auth.spec.ts       # Authentication flow tests
    ├── landing.spec.ts    # Landing page tests
    ├── quiz.spec.ts       # Quiz gameplay tests
    └── gradebook.spec.ts  # Gradebook/grading tests
```

## Unit Tests

Unit tests are located in `tests/unit/` and test pure JavaScript/TypeScript logic:

### What's Tested

1. **Gradebook Library** (`lib/gradebook.ts`)
   - Grade calculation for students
   - Summary statistics computation
   - Needs-grading detection
   - CSV export functionality
   - Edge cases (empty data, etc.)

2. **Albums Library** (`lib/albums.ts`)
   - Type structure validation
   - Block types (text, image, question)
   - Progress tracking logic
   - Points calculation
   - Status determination

3. **Auth Library** (`lib/auth.ts`)
   - User profile structure
   - Role validation (host/player)
   - Leaderboard sorting
   - Points calculations
   - Email validation helpers

### Running Unit Tests

```bash
# Run all unit tests
npm run test:run

# Run with coverage
npm run test:coverage

# Run in watch mode (re-runs on file changes)
npm test

# Run specific test file
npm run test:run tests/unit/lib/gradebook.test.ts
```

## E2E Tests

E2E tests are located in `tests/e2e/` and test the full user experience:

### What's Tested

1. **Authentication Flow**
   - Login page display and form elements
   - Signup page and role selection
   - Protected route redirects

2. **Landing Page**
   - Navigation to login/signup
   - Join class functionality
   - Mobile responsiveness

3. **Quiz Gameplay**
   - Join game interface
   - Host quiz creation pages
   - Engagement tools accessibility

4. **Gradebook**
   - Auth protection on gradebook pages
   - Student workbook views
   - Designer studio access

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run in headed mode (see the browser)
npm run test:e2e:headed

# Run with Playwright UI for debugging
npm run test:e2e:ui

# Run only in Chromium
npm run test:e2e:chromium
```

### Debugging Failed Tests

1. **View the HTML report:**
   ```bash
   npx playwright show-report
   ```

2. **Use UI mode for step-by-step debugging:**
   ```bash
   npm run test:e2e:ui
   ```

3. **Check screenshots in `test-results/` folder**

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '@/lib/myLib';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should navigate to dashboard', async ({ page }) => {
  await page.goto('/');
  await page.click('text=Dashboard');
  await expect(page).toHaveURL(/dashboard/);
});
```

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
      
      - run: npm ci
      
      # Unit tests
      - run: npm run test:run
      
      # E2E tests
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e:chromium
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## Coverage

Run coverage and check the report:

```bash
npm run test:coverage
```

Coverage report will be generated in `coverage/` directory.

## Mocking Firebase

The test setup (`tests/setup.ts`) includes mocks for:
- Firebase Firestore operations
- Firebase Authentication
- Browser APIs (ResizeObserver, matchMedia)

When writing tests that interact with Firebase, the mocks prevent actual database calls.
