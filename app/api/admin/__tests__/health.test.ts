// Mock global Response
global.Response = class MockResponse {
  body: any
  status: number
  headers: Headers
  constructor(body: any, init?: any) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers()
  }
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
} as any

// Mock Next.js server BEFORE imports
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
jest.mock('@/lib/auth/admin-middleware')
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/anthropic/client', () => ({
  anthropic: {},
}))

import { GET as getHealth } from '../health/route'
import { verifyAdmin } from '@/lib/auth/admin-middleware'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, mockAdminUser } from '../../../../__tests__/mocks/supabase'

describe('Admin Health API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockVerifyAdmin = verifyAdmin as jest.MockedFunction<typeof verifyAdmin>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
    
    // Set default environment variables
    process.env.ANTHROPIC_API_KEY = 'test-key'
    process.env.RESEND_API_KEY = 'test-key'
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.RESEND_API_KEY
  })

  describe('GET /api/admin/health', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const response = await getHealth()

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return system status with all services healthy', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      // Mock successful database query
      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
      }

      // Mock successful AI logs query
      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { created_at: new Date().toISOString() },
          error: null,
        }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.overall).toBe('healthy')
      expect(json.database.status).toBe('healthy')
      expect(json.anthropic.status).toBe('healthy')
      expect(json.resend.status).toBe('healthy')
      expect(json.resend.configured).toBe(true)
    })

    it('should check database connectivity', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
      }

      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.database).toBeDefined()
      expect(json.database.responseTime).toBeGreaterThanOrEqual(0)
      expect(mockSupabase.from).toHaveBeenCalledWith('users')
    })

    it('should check external services (Anthropic and Resend)', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
      }

      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { created_at: new Date().toISOString() },
          error: null,
        }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.anthropic).toBeDefined()
      expect(json.anthropic.status).toBe('healthy')
      expect(json.resend).toBeDefined()
      expect(json.resend.configured).toBe(true)
    })

    it('should handle service failures gracefully', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      // Mock database failure
      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Connection timeout' },
        }),
      }

      // Mock AI logs query failure
      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Query failed' },
        }),
      }

      // Remove API keys to simulate service down
      delete process.env.ANTHROPIC_API_KEY
      delete process.env.RESEND_API_KEY

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.overall).toBe('down')
      expect(json.database.status).toBe('down')
      expect(json.database.message).toContain('Connection timeout')
      expect(json.anthropic.status).toBe('down')
      expect(json.anthropic.message).toContain('not configured')
      expect(json.resend.status).toBe('down')
      expect(json.resend.configured).toBe(false)
    })

    it('should report degraded status for slow database', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      // Mock slow database query (simulate delay)
      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: [{ id: 'test' }], error: null })
            }, 1100) // More than 1000ms threshold
          })
        }),
      }

      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.database.status).toBe('degraded')
      expect(json.database.responseTime).toBeGreaterThan(1000)
      expect(json.database.message).toContain('Slow response')
    })

    it('should report degraded status for stale AI activity', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
      }

      // Mock AI logs with old timestamp (more than 24 hours ago)
      const oldDate = new Date()
      oldDate.setHours(oldDate.getHours() - 25)

      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { created_at: oldDate.toISOString() },
          error: null,
        }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockDbQuery : mockAIQuery
      })

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.anthropic.status).toBe('degraded')
      expect(json.anthropic.message).toContain('No recent activity')
      expect(json.overall).toBe('degraded')
    })

    it('should handle missing API keys', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      delete process.env.ANTHROPIC_API_KEY
      delete process.env.RESEND_API_KEY

      const mockDbQuery = {
        select: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [{ id: 'test' }], error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockDbQuery)

      const response = await getHealth()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.anthropic.status).toBe('down')
      expect(json.anthropic.message).toBe('API key not configured')
      expect(json.resend.status).toBe('down')
      expect(json.resend.message).toBe('API key not configured')
    })
  })
})