# Testing Documentation - Strength Manager

## Overview

This document outlines the testing strategy for Strength Manager, a CliftonStrengths coaching application designed for a few hundred users. The testing approach balances comprehensive coverage of critical paths with pragmatic resource allocation.

## Testing Philosophy

For an application of this scale (few hundred users), we prioritize:
1. **Critical path coverage** over exhaustive unit testing
2. **Business logic testing** (auth, utilities, core features)
3. **One comprehensive E2E test** over many fragmented tests
4. **Manual QA** for admin features and complex UI interactions

## Test Suite Structure

### Unit Tests (151 tests)

#### Utility Functions (59 tests)
- **[`strengths.test.ts`](strength-manager/__tests__/unit/utils/strengths.test.ts:1)** - 47 tests
  - Domain calculations and balance
  - Team analytics
  - Strength validation
  - Coverage: 98.14%

- **[`date-helpers.test.ts`](strength-manager/__tests__/unit/utils/date-helpers.test.ts:1)** - 8 tests
  - Date calculations for email scheduling
  - Coverage: 100%

- **[`ai-logger.test.ts`](strength-manager/__tests__/unit/utils/ai-logger.test.ts:1)** - 10 tests
  - AI usage tracking and cost calculation
  - Coverage: 100%

#### Admin Components (92 tests)
- **[`StatCard.test.tsx`](strength-manager/__tests__/unit/components/StatCard.test.tsx:1)** - 23 tests
  - Rendering with different props
  - Color variants
  - Coverage: 100%

- **[`StatusBadge.test.tsx`](strength-manager/__tests__/unit/components/StatusBadge.test.tsx:1)** - 20 tests
  - Status variants (success, warning, error, info)
  - Coverage: 100%

- **[`ChartCard.test.tsx`](strength-manager/__tests__/unit/components/ChartCard.test.tsx:1)** - 24 tests
  - Loading states
  - Children rendering
  - Coverage: 100%

- **[`DataTable.test.tsx`](strength-manager/__tests__/unit/components/DataTable.test.tsx:1)** - 25 tests
  - Search and filtering
  - Pagination
  - Row interactions
  - Coverage: 90.62%

### Integration Tests (34 tests)

#### Authentication (34 tests)
- **[`auth-actions.test.ts`](strength-manager/__tests__/integration/auth/auth-actions.test.ts:1)** - 13 tests
  - Login, signup, logout flows
  - Password reset
  - Coverage: 96.49%

- **[`onboarding-actions.test.ts`](strength-manager/__tests__/integration/auth/onboarding-actions.test.ts:1)** - 15 tests
  - Onboarding completion
  - Team member addition
  - Coverage: 95.23%

- **[`admin-middleware.test.ts`](strength-manager/__tests__/integration/auth/admin-middleware.test.ts:1)** - 6 tests
  - Admin authorization
  - Coverage: 100%

### End-to-End Tests (4 scenarios)

**[`critical-user-flow.spec.ts`](strength-manager/e2e/critical-user-flow.spec.ts:1)**
- Complete signup and onboarding journey
- Login with existing credentials
- Navigation and UI elements
- Responsive design verification

## Running Tests

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

## Coverage Report

**Current Coverage**: ~11% overall (focused on critical modules)

**High Coverage Areas** (95-100%):
- ✅ Authentication logic
- ✅ Utility functions
- ✅ Admin components
- ✅ Business logic

**Low/No Coverage Areas** (Manual QA):
- ⚠️ API route handlers (tested via E2E)
- ⚠️ Email templates (visual QA)
- ⚠️ Client-side components (E2E coverage)
- ⚠️ AI chat features (manual testing)

## Manual QA Checklist

For features not covered by automated tests, perform manual QA:

### Admin Dashboard
- [ ] User management table loads correctly
- [ ] User details modal shows complete information
- [ ] Email testing panel sends test emails
- [ ] AI usage analytics display correctly
- [ ] System health checks show accurate status
- [ ] Team statistics calculate properly

### Email System
- [ ] Welcome emails send on signup
- [ ] Weekly coaching emails generate with AI content
- [ ] Email templates render correctly in email clients
- [ ] Unsubscribe links work properly
- [ ] Email preferences save correctly

### AI Chat
- [ ] Chat conversations create and save
- [ ] AI responses stream correctly
- [ ] Follow-up questions generate
- [ ] Conversation history persists
- [ ] Token usage logs accurately

### Team Features
- [ ] Team members can be added/edited/deleted
- [ ] Team analytics calculate correctly
- [ ] Synergy tips generate appropriately
- [ ] Bulk upload works for CSV files

## CI/CD Pipeline

Tests run automatically on:
- Every push to main branch
- Every pull request
- Scheduled daily at 2 AM UTC

See [`.github/workflows/test.yml`](strength-manager/.github/workflows/test.yml:1) for configuration.

## Test Data Management

### Mocks
- **Supabase**: [`__tests__/mocks/supabase.ts`](strength-manager/__tests__/mocks/supabase.ts:1)
- **Anthropic AI**: [`__tests__/mocks/anthropic.ts`](strength-manager/__tests__/mocks/anthropic.ts:1)
- **Resend Email**: [`__tests__/mocks/resend.ts`](strength-manager/__tests__/mocks/resend.ts:1)
- **Test Utilities**: [`__tests__/mocks/test-utils.tsx`](strength-manager/__tests__/mocks/test-utils.tsx:1)

### Test Database
For E2E tests, use a separate Supabase project or local instance to avoid affecting production data.

## Adding New Tests

### Unit Test Template
```typescript
import { functionToTest } from '@/lib/utils/module'

describe('Module Name', () => {
  it('should handle happy path', () => {
    const result = functionToTest(validInput)
    expect(result).toBe(expectedOutput)
  })

  it('should handle edge cases', () => {
    const result = functionToTest(edgeCase)
    expect(result).toBeDefined()
  })

  it('should handle errors gracefully', () => {
    expect(() => functionToTest(invalidInput)).not.toThrow()
  })
})
```

### Integration Test Template
```typescript
import { actionToTest } from '@/app/actions/module'
import { createMockSupabaseClient } from '../../mocks/supabase'

jest.mock('@/lib/supabase/server')

describe('Action Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  it('should perform action successfully', async () => {
    const result = await actionToTest(validData)
    expect(result).toHaveProperty('success', true)
  })
})
```

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Request is not defined"
**Solution**: Mock Next.js server components in test file

**Issue**: Supabase mock chain fails
**Solution**: Setup mock chain before calling function:
```typescript
const mockSingle = jest.fn().mockResolvedValue({ data, error: null })
const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })
```

**Issue**: Coverage threshold not met
**Solution**: For this app scale, adjust thresholds in [`jest.config.js`](strength-manager/jest.config.js:1) to realistic levels (50-60%)

## Maintenance

### When to Update Tests

- **Always**: When changing business logic in utils or actions
- **Usually**: When modifying API routes or auth flows
- **Sometimes**: When updating UI components (if behavior changes)
- **Rarely**: For cosmetic UI changes

### Test Review Checklist

Before merging code:
- [ ] All existing tests pass
- [ ] New features have basic test coverage
- [ ] Critical paths remain tested
- [ ] No test warnings or deprecations

## Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Notes for Small-Scale Apps

This testing strategy is optimized for applications with:
- Few hundred users
- Small development team
- Limited QA resources
- Rapid iteration needs

**Key Principles**:
1. Test what breaks, not what works
2. One good E2E test > many fragile unit tests
3. Manual QA is acceptable for admin features
4. Focus on user-facing critical paths
5. Don't over-engineer for scale you don't have

---

**Last Updated**: 2024-10-13
**Test Count**: 185 passing
**Coverage**: ~11% (focused on critical modules at 95-100%)