import { POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { anthropic, CLAUDE_MODEL } from '@/lib/anthropic/client';
import { NextRequest } from 'next/server';
import { mockUser } from '@/__tests__/mocks/supabase';
import { mockAnthropicResponse } from '@/__tests__/mocks/anthropic';

// Mock dependencies
jest.mock('@/lib/supabase/server');
jest.mock('@/lib/anthropic/client', () => ({
  anthropic: {
    messages: {
      create: jest.fn(),
    },
  },
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;
const mockAnthropicCreate = anthropic.messages.create as jest.MockedFunction<
  typeof anthropic.messages.create
>;

describe('POST /api/chat', () => {
  let mockSupabase: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default Supabase mock
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
      from: jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: {
                name: 'Test User',
                top_5_strengths: ['Achiever', 'Strategic', 'Learner', 'Ideation', 'Input'],
              },
              error: null,
            }),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [
                {
                  name: 'John Doe',
                  top_5_strengths: ['Empathy', 'Developer', 'Harmony', 'Includer', 'Positivity'],
                },
              ],
              error: null,
            }),
          };
        }
        if (table === 'analytics_events') {
          return {
            insert: jest.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }),
    };

    mockCreateClient.mockResolvedValue(mockSupabase as any);

    // Setup default Anthropic mock
    mockAnthropicCreate.mockResolvedValue(mockAnthropicResponse as any);
  });

  describe('Authentication', () => {
    it('returns 401 when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Input Validation', () => {
    it('returns 400 when message is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message is required and must be a string');
    });

    it('returns 400 when message is not a string', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 123,
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message is required and must be a string');
    });

    it('returns 400 when message is too long', async () => {
      const longMessage = 'a'.repeat(5001);
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: longMessage,
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message too long (max 5000 characters)');
    });

    it('returns 400 when message is empty after trimming', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: '   ',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Message cannot be empty');
    });

    it('returns 400 when mode is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Mode is required');
    });

    it('returns 400 when mode is invalid', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'invalid-mode',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid mode');
    });
  });

  describe('My Strengths Mode', () => {
    it('successfully processes chat with my-strengths mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'How can I use my Achiever strength?',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.response).toBe('This is a mock AI response for testing purposes.');
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: expect.stringContaining('Achiever'),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'How can I use my Achiever strength?',
          }),
        ]),
      });
    });

    it('includes user strengths in system prompt for my-strengths mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'What are my blind spots?',
          mode: 'my-strengths',
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Achiever'),
        })
      );
    });
  });

  describe('Team Strengths Mode', () => {
    it('successfully processes chat with team-strengths mode', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'How should I manage John?',
          mode: 'team-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.response).toBe('This is a mock AI response for testing purposes.');
      expect(mockAnthropicCreate).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: expect.stringContaining('John Doe'),
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: 'How should I manage John?',
          }),
        ]),
      });
    });

    it('includes team member strengths in system prompt', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Team dynamics question',
          mode: 'team-strengths',
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Empathy'),
        })
      );
    });
  });

  describe('Conversation History', () => {
    it('includes conversation history in messages', async () => {
      const conversationHistory = [
        { role: 'user', content: 'First message' },
        { role: 'assistant', content: 'First response' },
      ];

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Second message',
          mode: 'my-strengths',
          conversationHistory,
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' },
            { role: 'user', content: 'Second message' },
          ],
        })
      );
    });

    it('handles empty conversation history', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'First message',
          mode: 'my-strengths',
          conversationHistory: [],
        }),
      });

      await POST(request);

      expect(mockAnthropicCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [{ role: 'user', content: 'First message' }],
        })
      );
    });
  });

  describe('Analytics Tracking', () => {
    it('logs analytics event after successful chat', async () => {
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      await POST(request);

      expect(mockSupabase.from).toHaveBeenCalledWith('analytics_events');
    });

    it('includes message and response length in analytics', async () => {
      const insertMock = jest.fn().mockResolvedValue({ data: null, error: null });
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'analytics_events') {
          return { insert: insertMock };
        }
        return mockSupabase.from(table);
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      await POST(request);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: mockUser.id,
          event_type: 'chat_message_sent',
          metadata: expect.objectContaining({
            mode: 'my-strengths',
            message_length: 12,
            response_length: expect.any(Number),
          }),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('handles AI API failures gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockAnthropicCreate.mockRejectedValue(new Error('AI API Error'));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate response');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in chat endpoint:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles database errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockRejectedValue(new Error('Database error')),
      }));

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate response');
      consoleErrorSpy.mockRestore();
    });

    it('handles non-text AI response content', async () => {
      mockAnthropicCreate.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'image', source: {} }],
      } as any);

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.response).toBe('Unable to generate response');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing user strengths data', async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'users') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { name: 'Test User', top_5_strengths: null },
              error: null,
            }),
          };
        }
        return mockSupabase.from(table);
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'my-strengths',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockAnthropicCreate).toHaveBeenCalled();
    });

    it('handles empty team members list', async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return mockSupabase.from(table);
      });

      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test message',
          mode: 'team-strengths',
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(200);
    });

    it('handles malformed request body', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const request = new NextRequest('http://localhost:3000/api/chat', {
        method: 'POST',
        body: 'invalid json',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to generate response');
      consoleErrorSpy.mockRestore();
    });
  });
});