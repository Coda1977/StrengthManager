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
jest.mock('@/lib/utils/strengthsData', () => ({
  strengthsData: {
    'Achiever': { domain: 'Executing' },
    'Activator': { domain: 'Influencing' },
    'Adaptability': { domain: 'Relationship Building' },
    'Analytical': { domain: 'Strategic Thinking' },
  },
}))

import { GET as getAIStats } from '../ai-stats/route'
import { GET as getEmailStats } from '../email-stats/route'
import { GET as getTeamStats } from '../team-stats/route'
import { verifyAdmin } from '@/lib/auth/admin-middleware'
import { createClient } from '@/lib/supabase/server'
import { createMockSupabaseClient, mockAdminUser } from '../../../../__tests__/mocks/supabase'
import { NextRequest } from 'next/server'

describe('Admin Stats API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockVerifyAdmin = verifyAdmin as jest.MockedFunction<typeof verifyAdmin>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('GET /api/admin/ai-stats - AI Usage Statistics', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/ai-stats')
      const response = await getAIStats(request)

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return AI usage data with optimized SELECT (Phase 2 fix)', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockAILogs = [
        {
          request_type: 'chat',
          model: 'claude-3-5-sonnet-20241022',
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
          estimated_cost: 0.001,
          created_at: '2024-01-01T10:00:00Z',
          user_id: 'user-1',
        },
        {
          request_type: 'title_generation',
          model: 'claude-3-5-sonnet-20241022',
          input_tokens: 50,
          output_tokens: 25,
          total_tokens: 75,
          estimated_cost: 0.0005,
          created_at: '2024-01-01T11:00:00Z',
          user_id: 'user-2',
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: mockAILogs, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/ai-stats?period=7d')
      const response = await getAIStats(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.totalRequests).toBe(2)
      expect(json.totalCost).toBe(0.0015)
      expect(json.totalInputTokens).toBe(150)
      expect(json.totalOutputTokens).toBe(75)
      expect(json.requestsByType).toHaveLength(2)
      expect(json.dailyUsage).toBeDefined()
      expect(json.costProjection).toBeDefined()
      
      // Verify optimized SELECT was used (not SELECT *)
      expect(mockQuery.select).toHaveBeenCalledWith(
        'request_type, model, input_tokens, output_tokens, total_tokens, estimated_cost, created_at, user_id'
      )
    })

    it('should handle different time periods', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      // Test 30d period
      const request30d = new NextRequest('http://localhost:3000/api/admin/ai-stats?period=30d')
      await getAIStats(request30d)
      expect(mockQuery.gte).toHaveBeenCalled()

      jest.clearAllMocks()
      mockQuery.gte.mockClear()

      // Test 'all' period (no date filter)
      const mockQueryAll = {
        select: jest.fn().mockResolvedValue({ data: [], error: null }),
      }
      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQueryAll)

      const requestAll = new NextRequest('http://localhost:3000/api/admin/ai-stats?period=all')
      await getAIStats(requestAll)
      
      // Should not call gte for 'all' period
      expect(mockQuery.gte).not.toHaveBeenCalled()
    })

    it('should calculate cost projections correctly', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockAILogs = [
        {
          request_type: 'chat',
          model: 'claude-3-5-sonnet-20241022',
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
          estimated_cost: 0.01,
          created_at: '2024-01-01T10:00:00Z',
          user_id: 'user-1',
        },
        {
          request_type: 'chat',
          model: 'claude-3-5-sonnet-20241022',
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
          estimated_cost: 0.01,
          created_at: '2024-01-02T10:00:00Z',
          user_id: 'user-1',
        },
      ]

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({ data: mockAILogs, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/ai-stats')
      const response = await getAIStats(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.costProjection.daily).toBe(0.01) // 0.02 / 2 days
      expect(json.costProjection.weekly).toBe(0.07) // daily * 7
      expect(json.costProjection.monthly).toBe(0.3) // daily * 30
    })

    it('should handle database errors', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        gte: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/ai-stats')
      const response = await getAIStats(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to fetch AI statistics')
    })
  })

  describe('GET /api/admin/email-stats - Email Statistics', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/email-stats')
      const response = await getEmailStats(request)

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return email metrics', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockEmailLogs = [
        {
          id: 'log-1',
          email_type: 'welcome',
          email_subject: 'Welcome!',
          status: 'sent',
          week_number: null,
          sent_at: '2024-01-01T10:00:00Z',
          resend_id: 'resend-1',
          user_id: 'user-1',
          users: { email: 'user1@example.com' },
        },
        {
          id: 'log-2',
          email_type: 'weekly_coaching',
          email_subject: 'Week 1',
          status: 'sent',
          week_number: 'Week 1',
          sent_at: '2024-01-02T10:00:00Z',
          resend_id: 'resend-2',
          user_id: 'user-2',
          users: { email: 'user2@example.com' },
        },
      ]

      const mockStatsLogs = [
        { email_type: 'welcome', status: 'sent', sent_at: '2024-01-01', week_number: null },
        { email_type: 'weekly_coaching', status: 'sent', sent_at: '2024-01-02', week_number: 'Week 1' },
        { email_type: 'weekly_coaching', status: 'failed', sent_at: '2024-01-03', week_number: 'Week 1' },
      ]

      const mockActiveSubs = [{ id: 'sub-1' }, { id: 'sub-2' }]
      const mockAllSubs = [
        { id: 'sub-1', is_active: true },
        { id: 'sub-2', is_active: true },
        { id: 'sub-3', is_active: false },
      ]

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        if (table === 'email_logs' && callCount === 1) {
          return {
            select: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: mockEmailLogs, error: null }),
          }
        }
        if (table === 'email_logs' && callCount === 2) {
          return {
            select: jest.fn().mockReturnThis(),
            gte: jest.fn().mockResolvedValue({ data: mockStatsLogs, error: null }),
          }
        }
        if (table === 'email_subscriptions' && callCount === 3) {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({ data: mockActiveSubs, error: null }),
          }
        }
        if (table === 'email_subscriptions' && callCount === 4) {
          return {
            select: jest.fn().mockResolvedValue({ data: mockAllSubs, error: null }),
          }
        }
        return { select: jest.fn().mockResolvedValue({ data: [], error: null }) }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/email-stats')
      const response = await getEmailStats(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.totalSent).toBe(2)
      expect(json.totalFailed).toBe(1)
      expect(json.welcomeEmails).toBe(1)
      expect(json.weeklyEmails).toBe(2)
      expect(json.activeSubscriptions).toBe(2)
      expect(json.unsubscribeRate).toBe(33.3) // 1/3 * 100
      expect(json.recentLogs).toHaveLength(2)
      expect(json.dailyTrend).toBeDefined()
      expect(json.weeklyPerformance).toBeDefined()
    })


    it('should handle database errors', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const request = new NextRequest('http://localhost:3000/api/admin/email-stats')
      const response = await getEmailStats(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to fetch email logs')
    })
  })

  describe('GET /api/admin/team-stats - Team Statistics', () => {
    it('should require admin role', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 }),
      } as any)

      const response = await getTeamStats()

      expect(response.status).toBe(403)
      const json = await response.json()
      expect(json.error).toBe('Forbidden')
    })

    it('should return team statistics', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockTeamMembers = [
        {
          id: 'tm-1',
          user_id: 'user-1',
          top_5_strengths: ['Achiever', 'Activator', 'Adaptability'],
        },
        {
          id: 'tm-2',
          user_id: 'user-1',
          top_5_strengths: ['Achiever', 'Analytical'],
        },
        {
          id: 'tm-3',
          user_id: 'user-2',
          top_5_strengths: ['Activator', 'Adaptability'],
        },
      ]

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await getTeamStats()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.totalTeams).toBe(3)
      expect(json.totalUsers).toBe(2) // 2 unique users
      expect(json.averageTeamSize).toBe('1.5') // 3 teams / 2 users
      expect(json.topStrengths).toBeDefined()
      expect(json.domainDistribution).toBeDefined()
      expect(json.teamSizeDistribution).toBeDefined()
    })

    it('should calculate domain distribution correctly', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockTeamMembers = [
        {
          id: 'tm-1',
          user_id: 'user-1',
          top_5_strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical'],
        },
      ]

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await getTeamStats()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.domainDistribution).toHaveLength(4)
      
      const domains = json.domainDistribution.map((d: any) => d.domain)
      expect(domains).toContain('Executing')
      expect(domains).toContain('Influencing')
      expect(domains).toContain('Relationship Building')
      expect(domains).toContain('Strategic Thinking')
    })

    it('should calculate team size distribution', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockTeamMembers = [
        { id: 'tm-1', user_id: 'user-1', top_5_strengths: ['Achiever'] },
        { id: 'tm-2', user_id: 'user-1', top_5_strengths: ['Activator'] },
        { id: 'tm-3', user_id: 'user-2', top_5_strengths: ['Adaptability'] },
        { id: 'tm-4', user_id: 'user-2', top_5_strengths: ['Analytical'] },
        { id: 'tm-5', user_id: 'user-2', top_5_strengths: ['Achiever'] },
        { id: 'tm-6', user_id: 'user-2', top_5_strengths: ['Activator'] },
      ]

      const mockQuery = {
        select: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await getTeamStats()

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.teamSizeDistribution).toBeDefined()
      
      const distribution = json.teamSizeDistribution
      const range1_2 = distribution.find((d: any) => d.range === '1-2')
      const range3_5 = distribution.find((d: any) => d.range === '3-5')
      
      expect(range1_2.count).toBe(1) // user-1 has 2 members
      expect(range3_5.count).toBe(1) // user-2 has 4 members
    })

    it('should handle database errors', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: true,
        userId: mockAdminUser.id,
      } as any)

      const mockQuery = {
        select: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      }

      ;(mockSupabase.from as jest.Mock).mockReturnValue(mockQuery)

      const response = await getTeamStats()

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to fetch team members')
    })
  })

  describe('Authorization Tests - All Stats Endpoints', () => {
    it('should reject non-admin on AI stats endpoint', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/ai-stats')
      const response = await getAIStats(request)

      expect(response.status).toBe(403)
    })

    it('should reject non-admin on email stats endpoint', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const request = new NextRequest('http://localhost:3000/api/admin/email-stats')
      const response = await getEmailStats(request)

      expect(response.status).toBe(403)
    })

    it('should reject non-admin on team stats endpoint', async () => {
      mockVerifyAdmin.mockResolvedValue({
        authorized: false,
        response: new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), { status: 403 }),
      } as any)

      const response = await getTeamStats()

      expect(response.status).toBe(403)
    })
  })
})