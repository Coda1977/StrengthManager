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
  NextRequest: class MockNextRequest {
    url: string
    method: string
    constructor(url: string, init?: any) {
      this.url = url
      this.method = init?.method || 'GET'
    }
  },
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

import { GET as getUsersGET } from '../users/route'
import { GET as getUserGET, DELETE as deleteUser } from '../users/[id]/route'
import { verifyAdmin } from '@/lib/auth/admin-middleware'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, mockAdminUser, mockUser } from '../../../../__tests__/mocks/supabase'
import { NextRequest } from 'next/server'

describe('Admin Users API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockVerifyAdmin = verifyAdmin as jest.MockedFunction<typeof verifyAdmin>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/admin/users - List Users', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsersGET(request)

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return user list for admin', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockUsers = [
        { id: 'user-1', name: 'User One', email: 'user1@example.com', role: 'user', created_at: '2024-01-01' },
        { id: 'user-2', name: 'User Two', email: 'user2@example.com', role: 'user', created_at: '2024-01-02' },
      ]

      const mockUsersQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: mockUsers, error: null, count: 2 }),
      }

      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      const mockEmailQuery = {
        select: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'users') return mockUsersQuery
        if (table === 'team_members') return mockTeamQuery
        if (table === 'email_subscriptions') return mockEmailQuery
        return mockUsersQuery
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsersGET(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.users).toHaveLength(2)
      expect(json.total).toBe(2)
    })

    it('should apply search filter', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/users?search=john')
      await getUsersGET(request)

      expect(mockQuery.or).toHaveBeenCalledWith(expect.stringContaining('john'))
    })

    it('should apply role filter', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/users?role=admin')
      await getUsersGET(request)

      expect(mockQuery.eq).toHaveBeenCalledWith('role', 'admin')
    })

    it('should respect 100 limit cap (Phase 1 fix)', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      // Request 500 items, should be capped at 100
      const request = new NextRequest('http://localhost:3000/api/admin/users?limit=500')
      await getUsersGET(request)

      // Verify range is called with max 100 items (0 to 99)
      expect(mockQuery.range).toHaveBeenCalledWith(0, 99)
    })

    it('should handle database errors gracefully', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' }, count: 0 }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsersGET(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to fetch users')
    })
  })

  describe('GET /api/admin/users/[id] - Get User Details', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1')
      const response = await getUserGET(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(403)
    })

    it('should return user details with conversation/message counts (Phase 2 optimization)', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockUserData = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        created_at: '2024-01-01',
        top_5_strengths: ['Achiever', 'Activator'],
      }

      // Mock user query
      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      }

      // Mock team members query
      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      // Mock email subscriptions query
      const mockEmailSubsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      // Mock email logs query
      const mockEmailLogsQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      // Mock conversation count query (optimized)
      const mockConvCountQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null, count: 5 }),
      }

      // Mock message count query (optimized)
      const mockMsgCountQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: null, error: null, count: 25 }),
      }

      // Mock AI usage query
      const mockAIQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'users') return mockUserQuery
        if (table === 'team_members') return mockTeamQuery
        if (table === 'email_subscriptions') return mockEmailSubsQuery
        if (table === 'email_logs') return mockEmailLogsQuery
        if (table === 'chat_conversations' && callCount === 5) return mockConvCountQuery
        if (table === 'chat_conversations' && callCount === 6) return mockMsgCountQuery
        if (table === 'ai_usage_logs') return mockAIQuery
        return mockUserQuery
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1')
      const response = await getUserGET(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.user).toEqual(mockUserData)
      expect(json.conversationsCount).toBe(5)
      expect(json.messagesCount).toBe(25)
      expect(json.aiUsage).toBeDefined()
    })

    it('should return 404 for non-existent user', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent')
      const response = await getUserGET(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('User not found')
    })
  })

  describe('DELETE /api/admin/users/[id] - Delete User', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(403)
    })

    it('should soft delete user successfully', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockUserData = {
        id: 'user-1',
        email: 'test@example.com',
      }

      // Mock user verification query
      const mockVerifyQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      }

      // Mock delete query
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? mockVerifyQuery : mockDeleteQuery
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.message).toContain('test@example.com')
    })

    it('should return 404 when deleting non-existent user', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/users/nonexistent', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('User not found')
    })

    it('should handle delete errors gracefully', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockUserData = {
        id: 'user-1',
        email: 'test@example.com',
      }

      // Mock user verification query
      const mockVerifyQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      }

      // Mock delete query with error
      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? mockVerifyQuery : mockDeleteQuery
      })

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to delete user')
    })
  })

  describe('Authorization Tests', () => {
    it('should reject non-admin user on GET /api/admin/users', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users')
      const response = await getUsersGET(request)

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toContain('Forbidden')
    })

    it('should reject non-admin user on GET /api/admin/users/[id]', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1')
      const response = await getUserGET(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(403)
    })

    it('should reject non-admin user on DELETE /api/admin/users/[id]', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/users/user-1', {
        method: 'DELETE',
      })
      const response = await deleteUser(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(403)
    })
  })
})