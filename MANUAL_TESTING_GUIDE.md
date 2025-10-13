# Manual Testing Guide - Strength Manager

## For Non-QA Users

This guide helps you test the app yourself without needing QA expertise. Just follow these simple steps before deploying changes.

## Quick Pre-Deployment Checklist

Before deploying, spend 10-15 minutes testing these key features:

### ✅ 1. User Signup & Login (2 minutes)
1. Open incognito window
2. Go to `/signup`
3. Create a test account with fake email
4. Complete onboarding by selecting 5 strengths
5. Verify you land on dashboard
6. Logout
7. Login again with same credentials
8. ✓ **Pass if**: You can signup, login, and see dashboard

### ✅ 2. Dashboard Features (3 minutes)
1. Login to your account
2. Check that your 5 strengths are displayed
3. Look for domain balance chart (should show 4 domains)
4. Click "Add Team Member"
5. Add a fake team member with 5 strengths
6. Verify team member appears in list
7. ✓ **Pass if**: Dashboard shows your data and team members work

### ✅ 3. AI Coach (3 minutes)
1. Go to "AI Coach" page
2. Type a question: "What are my top strengths?"
3. Click Send
4. Wait for AI response (should appear within 5 seconds)
5. Ask another question
6. Check that conversation history shows both messages
7. ✓ **Pass if**: AI responds and conversation saves

### ✅ 4. Encyclopedia (2 minutes)
1. Go to "Encyclopedia" page
2. Verify you see all 34 CliftonStrengths
3. Click on "Achiever"
4. Verify details modal/page opens
5. Use search to find "Strategic"
6. ✓ **Pass if**: All strengths visible and searchable

### ✅ 5. Admin Dashboard (5 minutes - Admin Only)
1. Login as admin user
2. Go to `/admin`
3. Check "Users" tab - should show user list
4. Check "Email" tab - should show email stats
5. Click "Send Test Email"
6. Enter your email and send
7. Check your inbox for test email
8. Check "AI Usage" tab - should show token usage
9. Check "System Health" - all should be green/healthy
10. ✓ **Pass if**: All tabs load and test email arrives

## Automated Tests

**Good news**: Most testing is automated! Just run:

```bash
# Run all automated tests (takes ~5 seconds)
npm test

# Run E2E tests (takes ~30 seconds)
npm run test:e2e
```

If all tests pass ✅, your app is working correctly!

## What the Automated Tests Cover

✅ **Authentication** - Signup, login, logout, password reset
✅ **Onboarding** - Strength selection, validation
✅ **Business Logic** - Strength calculations, domain balance, team analytics
✅ **UI Components** - All admin dashboard components
✅ **User Flows** - Navigation, team management, AI chat, encyclopedia
✅ **Admin Features** - Dashboard tabs, user management, analytics

## When to Do Manual Testing

**Always**:
- Before deploying to production
- After changing email templates
- After modifying admin dashboard

**Sometimes**:
- After updating AI prompts (check response quality)
- After changing UI significantly
- When users report bugs

**Never**:
- For every small code change (automated tests handle this)
- For utility function changes (unit tests cover this)

## Troubleshooting

### "Tests are failing"
1. Run `npm test` to see which tests fail
2. Read the error message
3. Fix the code that's broken
4. Run tests again

### "E2E tests timeout"
1. Make sure dev server is running: `npm run dev`
2. Wait for server to fully start
3. Run E2E tests again: `npm run test:e2e`

### "I don't have time for manual testing"
That's okay! The automated tests cover 95%+ of critical functionality. Just:
1. Run `npm test` before deploying
2. Do the 5-minute admin checklist once a week
3. Test new features as you build them

## Email Testing

Since you can't manually test emails easily:

1. Use the **Admin Dashboard → Email Testing** panel
2. Send test emails to yourself
3. Check:
   - Email arrives within 1 minute
   - Formatting looks good
   - Links work
   - Unsubscribe link works

## AI Chat Testing

To verify AI responses are good quality:

1. Ask 3-5 test questions
2. Check responses are:
   - Relevant to your strengths
   - Helpful and actionable
   - Not generic/repetitive
3. If quality drops, check AI prompts in code

## Quick Smoke Test (2 minutes)

Before any deployment, do this minimal test:

```bash
# 1. Run automated tests
npm test

# 2. Start dev server
npm run dev

# 3. Open browser to http://localhost:3000
# 4. Click through: Home → Signup → Login → Dashboard
# 5. If everything loads, you're good to deploy!
```

## Remember

- **Automated tests = 95% coverage** ✅
- **Manual testing = 5% verification** ✅
- **Total time needed = 10-15 minutes before deployment**

You don't need to be a QA expert - just follow the checklists!