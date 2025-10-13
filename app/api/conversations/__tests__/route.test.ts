import { GET, POST } from '../route';
import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { mockUser, mockConversation } from '@/__tests__/mocks/supabase';

// Mock dependencies
jest.mock('@/lib/supabase/server');

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('Conversations API Routes', () => {
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
        if (table === 'chat_conversations') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
              data: [mockConversation],
              error: null,
            }),
            single: jest.fn().mockResolvedValue({
              data: mockConversation,
              error: null,
            }),
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
  });

  describe('GET /api/conversations', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('Success Cases', () => {
      it('returns user conversations successfully', async () => {
        const conversations = [
          { ...mockConversation, id: 'conv-1', title: 'First Conversation' },
          { ...mockConversation, id: 'conv-2', title: 'Second Conversation' },
        ];

        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: conversations,
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.conversations).toHaveLength(2);
        expect(data.data.conversations[0].title).toBe('First Conversation');
        expect(data.data.conversations[1].title).toBe('Second Conversation');
      });

      it('queries conversations for authenticated user only', async () => {
        const eqMock = jest.fn().mockReturnThis();
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: eqMock,
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [mockConversation],
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        await GET(request);

        expect(eqMock).toHaveBeenCalledWith('user_id', mockUser.id);
      });

      it('orders conversations by updated_at descending', async () => {
        const orderMock = jest.fn().mockReturnThis();
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: orderMock,
          limit: jest.fn().mockResolvedValue({
            data: [mockConversation],
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        await GET(request);

        expect(orderMock).toHaveBeenCalledWith('updated_at', { ascending: false });
      });

      it('respects 50 conversation limit', async () => {
        const limitMock = jest.fn().mockResolvedValue({
          data: [mockConversation],
          error: null,
        });
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: limitMock,
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        await GET(request);

        expect(limitMock).toHaveBeenCalledWith(50);
      });

      it('returns empty array when user has no conversations', async () => {
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.conversations).toEqual([]);
      });
    });

    describe('Error Handling', () => {
      it('handles database errors gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSupabase.from = jest.fn(() => ({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch conversations');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching conversations:',
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });

      it('handles unexpected errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSupabase.from = jest.fn(() => {
          throw new Error('Unexpected error');
        });

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'GET',
        });

        const response = await GET(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to fetch conversations');
        consoleErrorSpy.mockRestore();
      });
    });
  });

  describe('POST /api/conversations', () => {
    describe('Authentication', () => {
      it('returns 401 when user is not authenticated', async () => {
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: null },
          error: null,
        });

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Conversation',
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
      it('returns 400 when title is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title is required and must be a string');
      });

      it('returns 400 when title is not a string', async () => {
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 123,
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title is required and must be a string');
      });

      it('returns 400 when title is too long', async () => {
        const longTitle = 'a'.repeat(201);
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: longTitle,
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title too long (max 200 characters)');
      });

      it('returns 400 when title is empty after trimming', async () => {
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: '   ',
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title cannot be empty');
      });

      it('returns 400 when mode is missing', async () => {
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Conversation',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Mode is required');
      });

      it('accepts valid title at maximum length', async () => {
        const maxTitle = 'a'.repeat(200);
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: maxTitle,
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });
    });

    describe('Success Cases', () => {
      it('creates conversation successfully', async () => {
        const newConversation = {
          ...mockConversation,
          title: 'New Conversation',
          mode: 'my-strengths',
        };

        const insertMock = jest.fn().mockReturnThis();
        const selectMock = jest.fn().mockReturnThis();
        const singleMock = jest.fn().mockResolvedValue({
          data: newConversation,
          error: null,
        });

        mockSupabase.from = jest.fn(() => ({
          insert: insertMock,
          select: selectMock,
          single: singleMock,
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Conversation',
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.data.conversation.title).toBe('New Conversation');
        expect(insertMock).toHaveBeenCalledWith({
          user_id: mockUser.id,
          title: 'New Conversation',
          mode: 'my-strengths',
        });
      });

      it('creates conversation with team-strengths mode', async () => {
        const insertMock = jest.fn().mockReturnThis();
        mockSupabase.from = jest.fn(() => ({
          insert: insertMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockConversation,
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Team Discussion',
            mode: 'team-strengths',
          }),
        });

        await POST(request);

        expect(insertMock).toHaveBeenCalledWith({
          user_id: mockUser.id,
          title: 'Team Discussion',
          mode: 'team-strengths',
        });
      });

      it('trims whitespace from title', async () => {
        const insertMock = jest.fn().mockReturnThis();
        mockSupabase.from = jest.fn(() => ({
          insert: insertMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockConversation,
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: '  Spaced Title  ',
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);

        expect(response.status).toBe(200);
      });

      it('associates conversation with authenticated user', async () => {
        const insertMock = jest.fn().mockReturnThis();
        mockSupabase.from = jest.fn(() => ({
          insert: insertMock,
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: mockConversation,
            error: null,
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'Test Conversation',
            mode: 'my-strengths',
          }),
        });

        await POST(request);

        expect(insertMock).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: mockUser.id,
          })
        );
      });
    });

    describe('Error Handling', () => {
      it('handles database errors gracefully', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSupabase.from = jest.fn(() => ({
          insert: jest.fn().mockReturnThis(),
          select: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: new Error('Database error'),
          }),
        }));

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Conversation',
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create conversation');
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error creating conversation:',
          expect.any(Error)
        );
        consoleErrorSpy.mockRestore();
      });

      it('handles malformed request body', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: 'invalid json',
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create conversation');
        consoleErrorSpy.mockRestore();
      });

      it('handles unexpected errors during creation', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
        mockSupabase.from = jest.fn(() => {
          throw new Error('Unexpected error');
        });

        const request = new NextRequest('http://localhost:3000/api/conversations', {
          method: 'POST',
          body: JSON.stringify({
            title: 'New Conversation',
            mode: 'my-strengths',
          }),
        });

        const response = await POST(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Failed to create conversation');
        consoleErrorSpy.mockRestore();
      });
    });
  });
});