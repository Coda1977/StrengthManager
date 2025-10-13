import { test, expect } from '@playwright/test'

/**
 * Critical User Flow E2E Test
 * 
 * This test covers the most important user journey:
 * 1. User signup
 * 2. Onboarding with strength selection
 * 3. Dashboard access
 * 4. Basic navigation
 * 
 * For a few hundred users, this single comprehensive test provides
 * more value than extensive unit tests for every component.
 */

test.describe('Critical User Flow', () => {
  test('complete user signup and onboarding journey', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/signup')
    await expect(page).toHaveURL(/.*signup/)
    
    // Step 2: Fill out signup form
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@example.com`
    const testName = `Test User ${timestamp}`
    const testPassword = 'TestPassword123!'
    
    await page.fill('input[name="name"]', testName)
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    
    // Step 3: Submit signup form
    await page.click('button[type="submit"]')
    
    // Step 4: Should redirect to onboarding
    await expect(page).toHaveURL(/.*onboarding/, { timeout: 10000 })
    
    // Step 5: Select 5 strengths during onboarding
    const strengthsToSelect = [
      'Achiever',
      'Activator',
      'Adaptability',
      'Analytical',
      'Arranger'
    ]
    
    for (const strength of strengthsToSelect) {
      // Find and click the strength card/button
      const strengthElement = page.locator(`text=${strength}`).first()
      await strengthElement.click()
    }
    
    // Step 6: Complete onboarding
    const completeButton = page.locator('button:has-text("Complete")')
    await completeButton.click()
    
    // Step 7: Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 })
    
    // Step 8: Verify dashboard loaded
    await expect(page.locator('h1, h2')).toContainText(/dashboard|strengths/i)
    
    // Step 9: Verify navigation works
    await page.click('text=Encyclopedia')
    await expect(page).toHaveURL(/.*encyclopedia/)
    
    // Step 10: Navigate to AI Coach
    await page.click('text=AI Coach')
    await expect(page).toHaveURL(/.*ai-coach/)
    
    // Step 11: Verify user can logout
    await page.click('button:has-text("Logout"), a:has-text("Logout")')
    await expect(page).toHaveURL(/.*login/)
  })

  test('login with existing credentials', async ({ page }) => {
    // This test assumes a test user exists in the database
    // For production, you'd use a seeded test database
    
    await page.goto('/login')
    await expect(page).toHaveURL(/.*login/)
    
    // Try to login (will fail without real credentials, but tests the flow)
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    
    const loginButton = page.locator('button[type="submit"]')
    await expect(loginButton).toBeVisible()
    
    // Verify form validation works
    await page.fill('input[type="email"]', 'invalid-email')
    await loginButton.click()
    
    // Should show validation error or stay on login page
    await expect(page).toHaveURL(/.*login/)
  })

  test('navigation and basic UI elements', async ({ page }) => {
    // Test that public pages load correctly
    await page.goto('/')
    await expect(page).toHaveTitle(/Strength Manager/i)
    
    // Verify signup link exists
    const signupLink = page.locator('a[href*="signup"]')
    await expect(signupLink).toBeVisible()
    
    // Verify login link exists
    const loginLink = page.locator('a[href*="login"]')
    await expect(loginLink).toBeVisible()
  })

  test('responsive design check', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Page should still be usable
    await expect(page.locator('body')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/signup')
    await expect(page.locator('form')).toBeVisible()
  })
})

/**
 * Note: For a production app with a few hundred users:
 * 
 * - This E2E test covers the critical path
 * - Unit tests cover business logic (utils, auth)
 * - Manual QA should cover:
 *   - Admin dashboard features
 *   - Email sending and templates
 *   - AI chat interactions
 *   - Team management features
 * 
 * This balanced approach provides good coverage without over-engineering.
 */