import { verifyAdmin } from '@/lib/auth/admin-middleware'
import { createMockSupabaseClient, mockUser, mockAdminUser } from '../../mocks/supabase'

// Mock Next.js server
jest.mock('next/server', () => ({
  NextResponse: {
    json: (body: any, init?: any) => ({
      json: async () => body,
      status: init?.status || 200,
      headers: new Headers(),
    }),
  },
}))

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('Admin Middleware Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
  })

  describe('verifyAdmin', () => {
    it('should authorize admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await verifyAdmin()

      expect(result.authorized).toBe(true)
      if (result.authorized) {
        expect(result.userId).toBe(mockAdminUser.id)
      }
    })

    it('should reject unauthenticated user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const result = await verifyAdmin()

      expect(result.authorized).toBe(false)
      if (!result.authorized) {
        expect(result.response.status).toBe(401)
        const json = await result.response.json()
        expect(json.error).toBe('Unauthorized')
      }
    })

    it('should reject non-admin user', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await verifyAdmin()

      expect(result.authorized).toBe(false)
      if (!result.authorized) {
        expect(result.response.status).toBe(403)
        const json = await result.response.json()
        expect(json.error).toBe('Forbidden - Admin access required')
      }
    })

    it('should reject when user data fetch fails', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await verifyAdmin()

      expect(result.authorized).toBe(false)
      if (!result.authorized) {
        expect(result.response.status).toBe(403)
      }
    })

    it('should reject when user data is missing', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      const result = await verifyAdmin()

      expect(result.authorized).toBe(false)
      if (!result.authorized) {
        expect(result.response.status).toBe(403)
      }
    })

    it('should query correct user from database', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAdminUser },
        error: null,
      })

      // Setup the chain for from().select().eq().single()
      const mockSingle = jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null,
      })
      const mockEq = jest.fn().mockReturnValue({ single: mockSingle })
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq })
      ;(mockSupabase.from as jest.Mock).mockReturnValue({ select: mockSelect })

      await verifyAdmin()

      expect(mockSupabase.from).toHaveBeenCalledWith('users')
      expect(mockSelect).toHaveBeenCalledWith('role')
      expect(mockEq).toHaveBeenCalledWith('id', mockAdminUser.id)
    })
  })
})