import { login, signup, logout, resetPassword, updatePassword, getUser } from '@/app/actions/auth'
import { createMockSupabaseClient, mockUser, mockSession } from '../../mocks/supabase'
import { createMockResendClient } from '../../mocks/resend'

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

jest.mock('@/lib/resend/client', () => ({
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

describe('Auth Actions Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  let mockResend: ReturnType<typeof createMockResendClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockResend = createMockResendClient()
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      await expect(login(formData)).rejects.toThrow('REDIRECT:/dashboard')
      
      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    it('should return error for invalid credentials', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'wrongpassword')

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      })

      const result = await login(formData)
      
      expect(result).toEqual({ error: 'Invalid credentials' })
    })

    it('should track login event', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')
      formData.append('password', 'password123')

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      try {
        await login(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events')
    })
  })

  describe('signup', () => {
    it('should successfully create new user account', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('name', 'New User')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/resend/client')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      await expect(signup(formData)).rejects.toThrow('REDIRECT:/onboarding')
      
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'password123',
      })
    })

    it('should return error for existing email', async () => {
      const formData = new FormData()
      formData.append('email', 'existing@example.com')
      formData.append('password', 'password123')
      formData.append('name', 'Test User')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'User already exists' },
      })

      const result = await signup(formData)
      
      expect(result).toEqual({ error: 'User already exists' })
    })

    it('should create user profile', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('name', 'New User')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/resend/client')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await signup(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should create default email preferences', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('name', 'New User')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/resend/client')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await signup(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(mockSupabase.from).toHaveBeenCalledWith('email_preferences')
    })

    it('should send welcome email', async () => {
      const formData = new FormData()
      formData.append('email', 'newuser@example.com')
      formData.append('password', 'password123')
      formData.append('name', 'New User')

      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      })

      const { sendWelcomeEmail } = require('@/lib/resend/client')
      sendWelcomeEmail.mockResolvedValue({ success: true })

      try {
        await signup(formData)
      } catch (e) {
        // Expected redirect
      }

      expect(sendWelcomeEmail).toHaveBeenCalledWith('newuser@example.com', 'New User')
    })
  })

  describe('logout', () => {
    it('should sign out user and redirect to login', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })

      await expect(logout()).rejects.toThrow('REDIRECT:/login')
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })
  })

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      const formData = new FormData()
      formData.append('email', 'test@example.com')

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({ error: null })

      const result = await resetPassword(formData)
      
      expect(result).toEqual({
        success: true,
        message: 'Password reset email sent',
      })
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        expect.objectContaining({
          redirectTo: expect.stringContaining('/reset-password'),
        })
      )
    })

    it('should return error if reset fails', async () => {
      const formData = new FormData()
      formData.append('email', 'invalid@example.com')

      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'User not found' },
      })

      const result = await resetPassword(formData)
      
      expect(result).toEqual({ error: 'User not found' })
    })
  })

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const formData = new FormData()
      formData.append('password', 'newpassword123')

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const result = await updatePassword(formData)
      
      expect(result).toEqual({
        success: true,
        message: 'Password updated successfully',
      })
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: 'newpassword123',
      })
    })

    it('should return error if update fails', async () => {
      const formData = new FormData()
      formData.append('password', 'weak')

      mockSupabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Password too weak' },
      })

      const result = await updatePassword(formData)
      
      expect(result).toEqual({ error: 'Password too weak' })
    })
  })

  describe('getUser', () => {
    it('should return user data when authenticated', async () => {
      const mockUserData = { id: mockUser.id, email: mockUser.email, name: 'Test User' }
      
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockUserData,
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await getUser()
      
      expect(result).toBeDefined()
      expect((result as any)?.id).toBe(mockUser.id)
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await getUser()
      
      expect(result).toBeNull()
    })
  })
})