# Test Suite - Strength Manager

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Test Structure

```
__tests__/
├── mocks/              # Shared test utilities and mocks
│   ├── supabase.ts     # Supabase client mocks
│   ├── anthropic.ts    # AI client mocks
│   ├── resend.ts       # Email service mocks
│   └── test-utils.tsx  # Custom render and helpers
├── unit/               # Unit tests
│   ├── utils/          # Utility function tests (59 tests)
│   └── components/     # Component tests (92 tests)
└── integration/        # Integration tests
    └── auth/           # Auth flow tests (34 tests)

e2e/
└── critical-user-flow.spec.ts  # E2E tests (4 scenarios)
```

## Test Count

- **Total**: 185 tests passing
- **Unit Tests**: 151 tests
- **Integration Tests**: 34 tests
- **E2E Tests**: 4 scenarios

## Coverage

**Critical Modules** (90-100% coverage):
- ✅ lib/utils (95%)
- ✅ lib/auth (100%)
- ✅ app/actions (96%)
- ✅ Tested admin components (90-100%)

**Overall**: ~11% (focused coverage strategy)

## Philosophy

For an app serving a few hundred users:
- **Test critical paths thoroughly**
- **Use E2E for complex flows**
- **Manual QA for admin features**
- **Don't over-engineer**

## CI/CD

Tests run automatically via GitHub Actions:
- On every push to main/develop
- On every pull request
- Daily at 2 AM UTC

See [`.github/workflows/test.yml`](../.github/workflows/test.yml) for details.

## Adding Tests

1. Create test file next to source: `filename.test.ts`
2. Import from mocks: `import { createMockSupabaseClient } from '../../mocks/supabase'`
3. Write clear test descriptions
4. Test happy path + edge cases + errors
5. Run `npm test` to verify

## Maintenance

- Update tests when changing business logic
- Keep mocks in sync with actual APIs
- Review E2E tests quarterly
- Manual QA for new admin features

---

For detailed documentation, see [`TESTING_DOCUMENTATION.md`](../TESTING_DOCUMENTATION.md)