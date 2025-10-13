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

// Mock dependencies BEFORE imports
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/anthropic/client', () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
      stream: jest.fn(),
    },
  },
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
}))

import { POST as generateTitle } from '../generate-title/route'
import { POST as generateFollowupQuestions } from '../followup-questions/route'
import { POST as generateStarterQuestions } from '../starter-questions/route'
import { createClient } from '@/lib/supabase/server'
import { anthropic } from '@/lib/anthropic/client'
import { createMockSupabaseClient, mockUser } from '../../../__tests__/mocks/supabase'
import { NextRequest } from 'next/server'

describe('AI Generation API Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
  const mockAnthropicCreate = anthropic.messages.create as jest.MockedFunction<any>

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    mockCreateClient.mockResolvedValue(mockSupabase as any)
  })

  describe('POST /api/generate-title - Generate Conversation Title', () => {
    it('should generate title successfully', async () => {
      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '{"title": "Managing Team Conflicts"}',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/generate-title', {
        method: 'POST',
        body: JSON.stringify({ firstMessage: 'How do I handle conflicts in my team?' }),
      })

      const response = await generateTitle(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.title).toBe('Managing Team Conflicts')
    })

    it('should handle AI failures gracefully with fallback', async () => {
      mockAnthropicCreate.mockRejectedValue(new Error('AI service unavailable'))

      const request = new NextRequest('http://localhost:3000/api/generate-title', {
        method: 'POST',
        body: JSON.stringify({ firstMessage: 'How do I handle conflicts in my team?' }),
      })

      const response = await generateTitle(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to generate title')
    })

    it('should use fallback when AI returns invalid JSON', async () => {
      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: 'Invalid JSON response',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const longMessage = 'This is a very long message that should be truncated to 50 characters for the fallback title'
      const request = new NextRequest('http://localhost:3000/api/generate-title', {
        method: 'POST',
        body: JSON.stringify({ firstMessage: longMessage }),
      })

      const response = await generateTitle(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.title).toBe(longMessage.slice(0, 50) + '...')
    })

    it('should require firstMessage parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-title', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateTitle(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('First message is required')
    })
  })

  describe('POST /api/followup-questions - Generate Follow-up Questions', () => {
    it('should generate follow-up questions successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '{"questions": ["How do I start this conversation?", "What if they resist?"]}',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/followup-questions', {
        method: 'POST',
        body: JSON.stringify({
          aiAnswer: 'You should leverage your Achiever strength to set clear goals.',
          conversationHistory: [
            { type: 'user', content: 'How can I motivate my team?' },
            { type: 'assistant', content: 'You should leverage your Achiever strength to set clear goals.' },
          ],
        }),
      })

      const response = await generateFollowupQuestions(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.questions).toHaveLength(2)
      expect(json.data.questions[0]).toBe('How do I start this conversation?')
    })

    it('should validate input parameters', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/followup-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateFollowupQuestions(request)

      expect(response.status).toBe(400)
      const json = await response.json()
      expect(json.error).toBe('AI answer is required')
    })

    it('should handle AI errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      mockAnthropicCreate.mockRejectedValue(new Error('AI service error'))

      const request = new NextRequest('http://localhost:3000/api/followup-questions', {
        method: 'POST',
        body: JSON.stringify({
          aiAnswer: 'You should leverage your Achiever strength.',
        }),
      })

      const response = await generateFollowupQuestions(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to generate follow-up questions')
    })

    it('should return empty array when AI returns invalid JSON', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: 'Invalid JSON',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/followup-questions', {
        method: 'POST',
        body: JSON.stringify({
          aiAnswer: 'You should leverage your Achiever strength.',
        }),
      })

      const response = await generateFollowupQuestions(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.questions).toEqual([])
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/followup-questions', {
        method: 'POST',
        body: JSON.stringify({
          aiAnswer: 'You should leverage your Achiever strength.',
        }),
      })

      const response = await generateFollowupQuestions(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })
  })

  describe('POST /api/starter-questions - Generate Starter Questions', () => {
    it('should generate starter questions successfully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUserData = {
        name: 'Test User',
        top_5_strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
      }

      const mockTeamMembers = [
        {
          name: 'John Doe',
          top_5_strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
        },
      ]

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      }

      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUserQuery : mockTeamQuery
      })

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '{"questions": ["How can I use my Achiever to motivate?", "What\'s the best way to delegate?", "How do I balance my Relator?"]}',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/starter-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateStarterQuestions(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.questions).toHaveLength(3)
    })

    it('should generate questions with team context', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUserData = {
        name: 'Test User',
        top_5_strengths: ['Achiever', 'Activator', 'Adaptability', 'Analytical', 'Arranger'],
      }

      const mockTeamMembers = [
        {
          name: 'John Doe',
          top_5_strengths: ['Strategic', 'Learner', 'Input', 'Intellection', 'Ideation'],
        },
        {
          name: 'Jane Smith',
          top_5_strengths: ['Woo', 'Communication', 'Positivity', 'Includer', 'Developer'],
        },
      ]

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUserData, error: null }),
      }

      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: mockTeamMembers, error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUserQuery : mockTeamQuery
      })

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: '{"questions": ["How do I work with John\'s Strategic?", "How can I leverage Jane\'s Woo?", "What\'s the team dynamic?"]}',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/starter-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateStarterQuestions(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.questions).toHaveLength(3)
      expect(mockAnthropicCreate).toHaveBeenCalled()
      
      // Verify the prompt includes team context
      const createCall = mockAnthropicCreate.mock.calls[0][0]
      expect(createCall.messages[0].content).toContain('John Doe')
      expect(createCall.messages[0].content).toContain('Jane Smith')
    })

    it('should use fallback questions when AI fails', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { top_5_strengths: [] }, error: null }),
      }

      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUserQuery : mockTeamQuery
      })

      const mockResponse = {
        id: 'msg_test',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [
          {
            type: 'text' as const,
            text: 'Invalid JSON',
          },
        ],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: 'end_turn' as const,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 50 },
      }

      mockAnthropicCreate.mockResolvedValue(mockResponse as any)

      const request = new NextRequest('http://localhost:3000/api/starter-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateStarterQuestions(request)

      expect(response.status).toBe(200)
      const json = await response.json()
      expect(json.data.questions).toHaveLength(3)
      expect(json.data.questions[0]).toBe('How can I better leverage my top strengths as a leader?')
    })

    it('should require authentication', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      })

      const request = new NextRequest('http://localhost:3000/api/starter-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateStarterQuestions(request)

      expect(response.status).toBe(401)
      const json = await response.json()
      expect(json.error).toBe('Unauthorized')
    })

    it('should handle AI service errors gracefully', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })

      const mockUserQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: { top_5_strengths: [] }, error: null }),
      }

      const mockTeamQuery = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      }

      let callCount = 0
      ;(mockSupabase.from as jest.Mock).mockImplementation((table: string) => {
        callCount++
        return table === 'users' ? mockUserQuery : mockTeamQuery
      })

      mockAnthropicCreate.mockRejectedValue(new Error('AI service error'))

      const request = new NextRequest('http://localhost:3000/api/starter-questions', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await generateStarterQuestions(request)

      expect(response.status).toBe(500)
      const json = await response.json()
      expect(json.error).toBe('Failed to generate starter questions')
    })
  })
})