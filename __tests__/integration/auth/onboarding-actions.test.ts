import { completeOnboarding, addTeamMember } from '@/app/actions/onboarding'
import { createMockSupabaseClient, mockUser } from '../../mocks/supabase'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/email/email-service', () => ({
  sendWelcomeEmail: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  redirect: jest.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`)
  }),
}))

describe('Onboarding Actions Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  describe('completeOnboarding', () => {
    const validStrengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']

    it('should complete onboarding with valid strengths', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/email/email-service')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      await expect(completeOnboarding(formData)).rejects.toThrow('REDIRECT:/dashboard')
    })

    it('should reject unauthenticated user', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await completeOnboarding(formData)

      expect(result).toEqual({ error: 'Not authenticated' })
    })

    it('should validate strength selection', async () => {
      const invalidStrengths = ['Achiever', 'InvalidStrength', 'Adaptability']
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(invalidStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await completeOnboarding(formData)

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('Invalid strengths')
    })

    it('should reject less than 5 strengths', async () => {
      const tooFewStrengths = ['Achiever', 'Activator']
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(tooFewStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await completeOnboarding(formData)

      expect(result).toHaveProperty('error')
      expect(result.error).toContain('exactly 5 strengths')
    })

    it('should update user profile with strengths', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/email/email-service')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await completeOnboarding(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should track onboarding completion event', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/email/email-service')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await completeOnboarding(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events')
    })

    it('should send welcome email', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup database mocks for the full flow
      const mockSingle = jest.fn().mockResolvedValue({
        data: { id: mockUser.id, email: mockUser.email, name: 'Test User' },
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      const mockUpdate = jest.fn().mockReturnValue({ eq: jest.fn().mockResolvedValue({ data: null, error: null }) })
      const mockInsert = jest.fn().mockResolvedValue({ data: null, error: null })
      
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'users') {
          return { update: mockUpdate, select: mockSelect }
        }
        return { insert: mockInsert }
      })

      const { sendWelcomeEmail } = require('@/lib/email/email-service')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await completeOnboarding(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(sendWelcomeEmail).toHaveBeenCalled()
    })

    it('should not fail if welcome email fails', async () => {
      const formData = new FormData()
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/email/email-service')
      sendWelcomeEmail.mockRejectedValue(new Error('Email service down'))

      // Should still redirect despite email failure
      await expect(completeOnboarding(formData)).rejects.toThrow('REDIRECT:/dashboard')
    })
  })

  describe('addTeamMember', () => {
    const validStrengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']

    it('should add team member with valid data', async () => {
      const formData = new FormData()
      formData.append('name', 'Team Member')
      formData.append('strengths', JSON.stringify(validStrengths))
      formData.append('notes', 'Great colleague')

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await addTeamMember(formData)

      expect(result).toEqual({ success: true })
      expect(mockSupabase.from).toHaveBeenCalledWith('team_members')
    })

    it('should reject unauthenticated user', async () => {
      const formData = new FormData()
      formData.append('name', 'Team Member')
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await addTeamMember(formData)

      expect(result).toEqual({ error: 'Not authenticated' })
    })

    it('should validate strength selection', async () => {
      const invalidStrengths = ['Achiever', 'InvalidStrength']
      const formData = new FormData()
      formData.append('name', 'Team Member')
      formData.append('strengths', JSON.stringify(invalidStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await addTeamMember(formData)

      expect(result).toHaveProperty('error')
    })

    it('should handle optional notes field', async () => {
      const formData = new FormData()
      formData.append('name', 'Team Member')
      formData.append('strengths', JSON.stringify(validStrengths))
      // No notes field

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await addTeamMember(formData)

      expect(result).toEqual({ success: true })
    })

    it('should return error if database insert fails', async () => {
      const formData = new FormData()
      formData.append('name', 'Team Member')
      formData.append('strengths', JSON.stringify(validStrengths))

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup mock to return error
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ insert: mockInsert })

      const result = await addTeamMember(formData)

      expect(result).toEqual({ error: 'Database error' })
    })
  })
})