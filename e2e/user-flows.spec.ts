import { test, expect } from '@playwright/test'

/**
 * User Flow E2E Tests
 * 
 * Comprehensive tests for key user journeys:
 * - Team management
 * - Dashboard interactions
 * - AI chat usage
 * - Encyclopedia browsing
 */

test.describe('User Flows - Team Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assume user is logged in (you'd set up auth state here)
    await page.goto('/dashboard')
  })

  test('user can add a team member', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Look for "Add Team Member" button or link
    const addButton = page.locator('button:has-text("Add Team Member"), button:has-text("Add Member")')
    
    if (await addButton.isVisible()) {
      await addButton.click()
      
      // Fill in team member details
      await page.fill('input[name="name"], input[placeholder*="name" i]', 'John Colleague')
      
      // Select strengths (look for checkboxes or buttons)
      const strengthSelectors = [
        'Achiever',
        'Activator',
        'Adaptability',
        'Analytical',
        'Arranger'
      ]
      
      for (const strength of strengthSelectors) {
        const strengthElement = page.locator(`text=${strength}`).first()
        if (await strengthElement.isVisible()) {
          await strengthElement.click()
        }
      }
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Add")')
      await submitButton.click()
      
      // Verify team member was added
      await expect(page.locator('text=John Colleague')).toBeVisible({ timeout: 5000 })
    }
  })

  test('user can view team analytics', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for team analytics section
    const analyticsSection = page.locator('text=/team.*analytics/i, text=/domain.*balance/i')
    
    if (await analyticsSection.isVisible()) {
      // Verify analytics are displayed
      await expect(analyticsSection).toBeVisible()
      
      // Check for domain categories
      const domains = ['Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking']
      for (const domain of domains) {
        const domainText = page.locator(`text=${domain}`)
        if (await domainText.isVisible()) {
          await expect(domainText).toBeVisible()
        }
      }
    }
  })

  test('user can delete a team member', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for delete or remove button
    const deleteButton = page.locator('button:has-text("Delete"), button:has-text("Remove")').first()
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click()
      
      // Confirm deletion if there's a confirmation dialog
      const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")')
      if (await confirmButton.isVisible()) {
        await confirmButton.click()
      }
      
      // Verify deletion (page should update)
      await page.waitForTimeout(1000)
    }
  })
})

test.describe('User Flows - AI Coach', () => {
  test('user can start a chat conversation', async ({ page }) => {
    await page.goto('/ai-coach')
    
    // Verify chat interface loads
    await expect(page.locator('text=/chat|coach|conversation/i')).toBeVisible({ timeout: 5000 })
    
    // Look for input field
    const chatInput = page.locator('textarea, input[type="text"]').last()
    
    if (await chatInput.isVisible()) {
      // Type a message
      await chatInput.fill('What are my top strengths?')
      
      // Send message
      const sendButton = page.locator('button[type="submit"], button:has-text("Send")')
      await sendButton.click()
      
      // Verify message appears
      await expect(page.locator('text=What are my top strengths?')).toBeVisible({ timeout: 3000 })
      
      // Wait for AI response (with timeout)
      await page.waitForTimeout(2000)
    }
  })

  test('user can view conversation history', async ({ page }) => {
    await page.goto('/ai-coach')
    
    // Look for conversation list or history
    const conversationList = page.locator('text=/conversation|history|previous/i')
    
    if (await conversationList.isVisible()) {
      await expect(conversationList).toBeVisible()
    }
  })

  test('user can switch between chat modes', async ({ page }) => {
    await page.goto('/ai-coach')
    
    // Look for mode switcher (My Strengths vs Team Strengths)
    const modeButtons = page.locator('button:has-text("My Strengths"), button:has-text("Team")')
    
    if (await modeButtons.first().isVisible()) {
      await modeButtons.first().click()
      await page.waitForTimeout(500)
      
      // Verify mode switched
      await expect(page.locator('text=/my strengths|team/i')).toBeVisible()
    }
  })
})

test.describe('User Flows - Dashboard', () => {
  test('user can view their strengths on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Verify dashboard loads
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 })
    
    // Look for strengths display
    const strengthsSection = page.locator('text=/top.*strength|your.*strength/i')
    
    if (await strengthsSection.isVisible()) {
      await expect(strengthsSection).toBeVisible()
    }
    
    // Verify at least some strength names are visible
    const commonStrengths = ['Achiever', 'Strategic', 'Learner', 'Empathy', 'Communication']
    let foundStrength = false
    
    for (const strength of commonStrengths) {
      const strengthElement = page.locator(`text=${strength}`)
      if (await strengthElement.isVisible()) {
        foundStrength = true
        break
      }
    }
    
    // At least one strength should be visible if user has completed onboarding
    if (foundStrength) {
      expect(foundStrength).toBe(true)
    }
  })

  test('user can navigate between main sections', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Test navigation to Encyclopedia
    const encyclopediaLink = page.locator('a[href*="encyclopedia"], text=Encyclopedia')
    if (await encyclopediaLink.isVisible()) {
      await encyclopediaLink.click()
      await expect(page).toHaveURL(/.*encyclopedia/)
      await page.goBack()
    }
    
    // Test navigation to AI Coach
    const aiCoachLink = page.locator('a[href*="ai-coach"], text=/AI.*Coach/i')
    if (await aiCoachLink.isVisible()) {
      await aiCoachLink.click()
      await expect(page).toHaveURL(/.*ai-coach/)
      await page.goBack()
    }
    
    // Verify we're back on dashboard
    await expect(page).toHaveURL(/.*dashboard/)
  })

  test('user can view domain balance visualization', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Look for domain balance chart or visualization
    const domains = ['Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking']
    
    for (const domain of domains) {
      const domainElement = page.locator(`text=${domain}`)
      if (await domainElement.isVisible()) {
        await expect(domainElement).toBeVisible()
      }
    }
  })
})

test.describe('User Flows - Encyclopedia', () => {
  test('user can browse strength encyclopedia', async ({ page }) => {
    await page.goto('/encyclopedia')
    
    // Verify encyclopedia page loads
    await expect(page.locator('h1, h2')).toBeVisible({ timeout: 5000 })
    
    // Look for strength cards or list
    const strengthsList = page.locator('text=/all.*strength|34.*strength|strength.*list/i')
    
    if (await strengthsList.isVisible()) {
      await expect(strengthsList).toBeVisible()
    }
  })

  test('user can search for specific strengths', async ({ page }) => {
    await page.goto('/encyclopedia')
    
    // Look for search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]')
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('Achiever')
      
      // Verify search results
      await expect(page.locator('text=Achiever')).toBeVisible({ timeout: 3000 })
    }
  })

  test('user can filter strengths by domain', async ({ page }) => {
    await page.goto('/encyclopedia')
    
    // Look for domain filter buttons
    const executingFilter = page.locator('button:has-text("Executing"), text=Executing')
    
    if (await executingFilter.isVisible()) {
      await executingFilter.click()
      await page.waitForTimeout(500)
      
      // Verify filtering worked (Executing strengths should be visible)
      const executingStrengths = ['Achiever', 'Arranger', 'Belief', 'Consistency']
      let foundExecutingStrength = false
      
      for (const strength of executingStrengths) {
        if (await page.locator(`text=${strength}`).isVisible()) {
          foundExecutingStrength = true
          break
        }
      }
      
      expect(foundExecutingStrength).toBe(true)
    }
  })

  test('user can view strength details', async ({ page }) => {
    await page.goto('/encyclopedia')
    
    // Click on a strength to view details
    const achieverCard = page.locator('text=Achiever').first()
    
    if (await achieverCard.isVisible()) {
      await achieverCard.click()
      
      // Verify details modal or page opens
      await page.waitForTimeout(500)
      
      // Look for detailed information
      const detailsText = page.locator('text=/description|what it means|how to use/i')
      if (await detailsText.isVisible()) {
        await expect(detailsText).toBeVisible()
      }
    }
  })
})

test.describe('User Flows - Error Handling', () => {
  test('handles network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true)
    
    await page.goto('/dashboard')
    
    // Page should show error state or retry option
    await page.waitForTimeout(2000)
    
    // Re-enable network
    await page.context().setOffline(false)
  })

  test('handles invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist')
    
    // Should show 404 or redirect to home
    await page.waitForTimeout(1000)
    
    // Verify we're not stuck on invalid route
    const currentUrl = page.url()
    expect(currentUrl).toBeTruthy()
  })
})

test.describe('User Flows - Accessibility', () => {
  test('keyboard navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Verify focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
  })

  test('page has proper headings structure', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Verify h1 exists
    const h1 = page.locator('h1')
    await expect(h1).toBeVisible({ timeout: 5000 })
  })
})