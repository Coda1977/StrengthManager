import { logAIUsage, extractTokenCounts } from '@/lib/utils/ai-logger'
import type { LogAIUsageParams } from '@/lib/utils/ai-logger'
import { createMockSupabaseClient } from '../../mocks/supabase'

// Mock the Supabase server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('ai-logger utility functions', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>
  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabase = createMockSupabaseClient()
    const { createClient } = require('@/lib/supabase/server')
    createClient.mockResolvedValue(mockSupabase)
    
    // Spy on console.error to verify error handling
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy.mockRestore()
  })

  describe('logAIUsage', () => {
    it('should log AI usage with all parameters', async () => {
      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 100,
        outputTokens: 50,
        userId: 'test-user-id',
        conversationId: 'test-conversation-id',
      }

      await logAIUsage(params)

      expect(mockSupabase.from).toHaveBeenCalledWith('ai_usage_logs')
      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(fromResult.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          request_type: 'chat',
          model: 'claude-3-5-sonnet-20241022',
          input_tokens: 100,
          output_tokens: 50,
          total_tokens: 150,
          user_id: 'test-user-id',
          conversation_id: 'test-conversation-id',
        })
      )
    })

    it('should calculate estimated cost correctly', async () => {
      const params: LogAIUsageParams = {
        requestType: 'email_content',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 1000,
        outputTokens: 500,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      const callArgs = (fromResult.insert as jest.Mock).mock.calls[0][0]
      
      // Input: 1000 tokens = 0.001M * $3 = $0.003
      // Output: 500 tokens = 0.0005M * $15 = $0.0075
      // Total: $0.0105
      expect(callArgs.estimated_cost).toBeCloseTo(0.0105, 4)
    })

    it('should handle missing optional parameters', async () => {
      const params: LogAIUsageParams = {
        requestType: 'insights',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 200,
        outputTokens: 100,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(fromResult.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: null,
          conversation_id: null,
        })
      )
    })

    it('should handle different request types', async () => {
      const requestTypes: Array<LogAIUsageParams['requestType']> = [
        'chat',
        'email_content',
        'insights',
        'title_generation',
        'synergy_tips',
      ]

      for (const requestType of requestTypes) {
        jest.clearAllMocks()
        mockSupabase = createMockSupabaseClient()
        const { createClient } = require('@/lib/supabase/server')
        createClient.mockResolvedValue(mockSupabase)
        
        const params: LogAIUsageParams = {
          requestType,
          model: 'claude-3-5-sonnet-20241022',
          inputTokens: 100,
          outputTokens: 50,
        }

        await logAIUsage(params)

        const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
        expect(fromResult.insert).toHaveBeenCalledWith(
          expect.objectContaining({
            request_type: requestType,
          })
        )
      }
    })

    it('should calculate total tokens correctly', async () => {
      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 250,
        outputTokens: 150,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(fromResult.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          total_tokens: 400,
        })
      )
    })

    it('should fail gracefully on database error', async () => {
      // Create a fresh mock with error response
      const mockInsert = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      })
      
      const mockFrom = jest.fn(() => ({
        insert: mockInsert,
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
      }))
      
      const errorMockSupabase = {
        from: mockFrom,
        auth: mockSupabase.auth,
        rpc: mockSupabase.rpc,
      }
      
      const { createClient } = require('@/lib/supabase/server')
      createClient.mockResolvedValue(errorMockSupabase)

      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 100,
        outputTokens: 50,
      }

      // Should not throw
      await expect(logAIUsage(params)).resolves.not.toThrow()
      
      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to log AI usage:',
        expect.any(Object)
      )
    })

    it('should fail gracefully on exception', async () => {
      const { createClient } = require('@/lib/supabase/server')
      createClient.mockRejectedValue(new Error('Connection failed'))

      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 100,
        outputTokens: 50,
      }

      // Should not throw
      await expect(logAIUsage(params)).resolves.not.toThrow()
      
      // Should log error
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in logAIUsage:',
        expect.any(Error)
      )
    })

    it('should handle zero tokens', async () => {
      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 0,
        outputTokens: 0,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      expect(fromResult.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          input_tokens: 0,
          output_tokens: 0,
          total_tokens: 0,
          estimated_cost: 0,
        })
      )
    })

    it('should handle large token counts', async () => {
      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 100000,
        outputTokens: 50000,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      const callArgs = (fromResult.insert as jest.Mock).mock.calls[0][0]
      
      // Input: 100000 tokens = 0.1M * $3 = $0.30
      // Output: 50000 tokens = 0.05M * $15 = $0.75
      // Total: $1.05
      expect(callArgs.estimated_cost).toBeCloseTo(1.05, 2)
    })
  })

  describe('extractTokenCounts', () => {
    it('should extract token counts from valid response', () => {
      const response = {
        usage: {
          input_tokens: 150,
          output_tokens: 75,
        },
      }

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(150)
      expect(result.outputTokens).toBe(75)
    })

    it('should return zero for missing usage object', () => {
      const response = {}

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(0)
      expect(result.outputTokens).toBe(0)
    })

    it('should return zero for missing input_tokens', () => {
      const response = {
        usage: {
          output_tokens: 75,
        },
      }

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(0)
      expect(result.outputTokens).toBe(75)
    })

    it('should return zero for missing output_tokens', () => {
      const response = {
        usage: {
          input_tokens: 150,
        },
      }

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(150)
      expect(result.outputTokens).toBe(0)
    })

    it('should handle null usage object', () => {
      const response = {
        usage: null,
      }

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(0)
      expect(result.outputTokens).toBe(0)
    })

    it('should handle undefined response', () => {
      const result = extractTokenCounts(undefined as any)

      expect(result.inputTokens).toBe(0)
      expect(result.outputTokens).toBe(0)
    })

    it('should handle response with extra fields', () => {
      const response = {
        id: 'msg_123',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          input_tokens: 200,
          output_tokens: 100,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 0,
        },
      }

      const result = extractTokenCounts(response)

      expect(result.inputTokens).toBe(200)
      expect(result.outputTokens).toBe(100)
    })
  })

  describe('cost calculation accuracy', () => {
    it('should calculate cost for typical chat interaction', async () => {
      const params: LogAIUsageParams = {
        requestType: 'chat',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 500,
        outputTokens: 300,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      const callArgs = (fromResult.insert as jest.Mock).mock.calls[0][0]
      
      // Input: 500 tokens = 0.0005M * $3 = $0.0015
      // Output: 300 tokens = 0.0003M * $15 = $0.0045
      // Total: $0.006
      expect(callArgs.estimated_cost).toBeCloseTo(0.006, 4)
    })

    it('should calculate cost for email generation', async () => {
      const params: LogAIUsageParams = {
        requestType: 'email_content',
        model: 'claude-3-5-sonnet-20241022',
        inputTokens: 2000,
        outputTokens: 1000,
      }

      await logAIUsage(params)

      const fromResult = (mockSupabase.from as jest.Mock).mock.results[0].value
      const callArgs = (fromResult.insert as jest.Mock).mock.calls[0][0]
      
      // Input: 2000 tokens = 0.002M * $3 = $0.006
      // Output: 1000 tokens = 0.001M * $15 = $0.015
      // Total: $0.021
      expect(callArgs.estimated_cost).toBeCloseTo(0.021, 4)
    })
  })
})