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
    _body: any
    constructor(url: string, init?: any) {
      this.url = url
      this.method = init?.method || 'GET'
      this._body = init?.body
    }
    async json() {
      return this._body
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
jest.mock('@/lib/supabase/server')

import { GET, POST } from '../route'
import { PUT, DELETE } from '../[id]/route'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, mockUser } from '../../../../__tests__/mocks/supabase'
import { NextRequest } from 'next/server'

describe('Team Members API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/team-members - Get Team Members', () => {
    it('should return user\'s team members successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockTeamMembers = [
        {
          id: 'tm-1',
          name: 'John Doe',
          top_5_strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
          notes: 'Great team player',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'tm-2',
          name: 'Jane Smith',
          top_5_strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
          notes: 'Excellent strategist',
          created_at: '2024-01-02T00:00:00Z',
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await GET()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toHaveLength(2)
      expect(json[0]).toEqual({
        id: 'tm-1',
        name: 'John Doe',
        strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        notes: 'Great team player',
      })
      expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUser.id)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const response = await GET()

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await GET()

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Database error')
    })
  })

  describe('POST /api/team-members - Create Team Member', () => {
    it('should create team member successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const newMember = {
        name: 'New Member',
        strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
      }

      const mockInsertedMember = {
        id: 'tm-new',
        name: newMember.name,
        top_5_strengths: newMember.strengths,
      }

      const mockInsertQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockInsertedMember, error: null }),
      }

      const mockAnalyticsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'team_members' ? mockInsertQuery : mockAnalyticsQuery
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify(newMember),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({
        id: 'tm-new',
        name: 'New Member',
        strengths: newMember.strengths,
      })
    })

    it('should validate name is required (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Name is required and must be a string')
    })

    it('should validate name is a string (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 123,
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Name is required and must be a string')
    })

    it('should validate name is not empty (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: '   ',
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Name cannot be empty')
    })

    it('should validate name length (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'a'.repeat(101),
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Name too long (max 100 characters)')
    })

    it('should validate strengths is an array (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member',
          strengths: 'not an array',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Strengths must be an array')
    })

    it('should require exactly 5 strengths (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member',
          strengths: ['Achiever', 'Activator', 'Adaptability'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Must provide exactly 5 strengths')
    })

    it('should validate each strength is a valid string (Phase 1 fix)', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member',
          strengths: ['Achiever', '', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Each strength must be a non-empty string (max 50 characters)')
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member',
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/team-members', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Member',
          strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Insert failed')
    })
  })

  describe('PUT /api/team-members/[id] - Update Team Member', () => {
    it('should update team member successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const updateData = {
        name: 'Updated Name',
        strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
      }

      const mockExisting = {
        user_id: mockUser.id,
      }

      const mockUpdated = {
        id: 'tm-1',
        name: updateData.name,
        top_5_strengths: updateData.strengths,
      }

      const mockVerifyQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExisting, error: null }),
      }

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? mockVerifyQuery : mockUpdateQuery
      })

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'PUT',
        body: JSON.stringify(updateData),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json).toEqual({
        id: 'tm-1',
        name: 'Updated Name',
        strengths: updateData.strengths,
      })
    })

    it('should validate input data', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Test',
          // Missing strengths
        }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid request body')
    })

    it('should only allow owner to update member', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockExisting = {
        user_id: 'different-user-id',
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExisting, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
          strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
        }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('Not found or unauthorized')
    })

    it('should return 404 for non-existent member', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/team-members/nonexistent', {
        method: 'PUT',
        body: JSON.stringify({
          name: 'Updated Name',
          strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
        }),
      })

      const response = await PUT(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('Not found or unauthorized')
    })
  })

  describe('DELETE /api/team-members/[id] - Delete Team Member', () => {
    it('should delete team member successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockExisting = {
        user_id: mockUser.id,
        name: 'Test Member',
      }

      const mockVerifyQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExisting, error: null }),
      }

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      const mockAnalyticsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        if (callCount === 1) return mockVerifyQuery
        if (callCount === 2) return mockDeleteQuery
        return mockAnalyticsQuery
      })

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
    })

    it('should only allow owner to delete member', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockExisting = {
        user_id: 'different-user-id',
        name: 'Test Member',
      }

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExisting, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('Not found or unauthorized')
    })

    it('should return 404 for non-existent member', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/team-members/nonexistent', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'nonexistent' }) })

      expect(response.status).toBe(404)
      const json = await response.json()
      expect(json.error).toBe('Not found or unauthorized')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockExisting = {
        user_id: mockUser.id,
        name: 'Test Member',
      }

      const mockVerifyQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockExisting, error: null }),
      }

      const mockDeleteQuery = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation(() => {
        callCount++
        return callCount === 1 ? mockVerifyQuery : mockDeleteQuery
      })

      const request = new NextRequest('http://localhost:3000/api/team-members/tm-1', {
        method: 'DELETE',
      })

      const response = await DELETE(request, { params: Promise.resolve({ id: 'tm-1' }) })

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Delete failed')
    })
  })
})