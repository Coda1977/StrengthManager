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
jest.mock('@/lib/utils/strengths')

import { PATCH } from '../strengths/route'
import { createClient } from '@/lib/supabase/server'
import { validateStrengthSelection } from '@/lib/utils/strengths'
import { createMockSupabaseClient, mockUser } from '../../../../__tests__/mocks/supabase'
import { NextRequest } from 'next/server'

describe('User Strengths API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  const mockValidateStrengthSelection = validateStrengthSelection as jest.MockedFunction<typeof validateStrengthSelection>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('PATCH /api/user/strengths - Update User Strengths', () => {
    it('should update user strengths successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const newStrengths = ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger']

      mockValidateStrengthSelection.mockReturnValue({
        valid: true,
        errors: [],
      })

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      const mockAnalyticsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUpdateQuery : mockAnalyticsQuery
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: newStrengths }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.success).toBe(true)
      expect(json.topStrengths).toEqual(newStrengths)
      expect(mockUpdateQuery.update).toHaveBeenCalledWith({ top_5_strengths: newStrengths })
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('id', mockUser.id)
    })

    it('should return 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'] }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('should validate strengths array is provided', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({}),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid request body')
    })

    it('should validate strengths is an array', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: 'not an array' }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid request body')
    })

    it('should require exactly 5 strengths', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockValidateStrengthSelection.mockReturnValue({
        valid: false,
        errors: ['Must select exactly 5 strengths'],
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: ['Achiever', 'Activator', 'Adaptability'] }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Must select exactly 5 strengths')
    })

    it('should validate strength names are valid', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockValidateStrengthSelection.mockReturnValue({
        valid: false,
        errors: ['Invalid strength: InvalidStrength'],
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'InvalidStrength'] }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('Invalid strength: InvalidStrength')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockValidateStrengthSelection.mockReturnValue({
        valid: true,
        errors: [],
      })

      const mockQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: { message: 'Update failed' } }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'] }),
      })

      const response = await PATCH(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Update failed')
    })

    it('should track analytics event on successful update', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const newStrengths = ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation']

      mockValidateStrengthSelection.mockReturnValue({
        valid: true,
        errors: [],
      })

      const mockUpdateQuery = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      }

      const mockAnalyticsQuery = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUpdateQuery : mockAnalyticsQuery
      })

      const request = new NextRequest('http://localhost:3000/api/user/strengths', {
        method: 'PATCH',
        body: JSON.stringify({ topStrengths: newStrengths }),
      })

      await PATCH(request)

      expect(mockAnalyticsQuery.insert).toHaveBeenCalledWith({
        user_id: mockUser.id,
        event_type: 'strengths_updated',
        metadata: { strengths: newStrengths },
      })
    })
  })
})