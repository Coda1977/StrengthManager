import { createMockSupabaseClient } from '../../../../__tests__/mocks/supabase';
import { UnsubscribeToken } from '@/lib/email/types';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextResponse: class MockNextResponse {
    constructor(body: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
      this.headers = new Map(Object.entries(init?.headers || {}));
    }
    body: any;
    status: number;
    headers: Map<string, string>;
    
    async text() {
      return this.body;
    }
    
    static json(data: any, init?: any) {
      return new MockNextResponse(JSON.stringify(data), init);
    }
  },
  NextRequest: class MockNextRequest {
    constructor(url: string) {
      this.url = url;
    }
    url: string;
  },
}));

// Import after mocks
const { GET } = require('../unsubscribe/route');
const { NextRequest } = require('next/server');

describe('Email Unsubscribe API Route Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  const mockBaseUrl = 'http://localhost:3000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockSupabase = createMockSupabaseClient();

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    // Set environment variable
    process.env.NEXT_PUBLIC_APP_URL = mockBaseUrl;
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  describe('GET /api/email/unsubscribe', () => {
    it('should successfully unsubscribe with valid token', async () => {
      const validToken: UnsubscribeToken = {
        id: 'token-123',
        user_id: 'user-123',
        token: 'valid-token-abc123',
        email_type: 'weekly_coaching',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      // Mock token validation
      const mockSingle = jest.fn().mockResolvedValue({
        data: validToken,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      // Mock token update
      const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      // Mock subscription update
      const mockSubUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockSubUpdate = jest.fn().mockReturnValue({ eq: mockSubUpdateEq });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'email_subscriptions') {
          return {
            update: mockSubUpdate,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=valid-token-abc123`
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/html');

      const html = await response.text();
      expect(html).toContain('Unsubscribed Successfully');
      expect(html).toContain('weekly coaching emails');
    });

    it('should handle expired token', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null, // Token not found because it's expired
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from = jest.fn(() => ({
        select: mockSelect,
      })) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=expired-token`
      );

      const response = await GET(request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Link Expired');
      expect(html).toContain('expired or has already been used');
    });

    it('should handle invalid token', async () => {
      const mockSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      mockSupabase.from = jest.fn(() => ({
        select: mockSelect,
      })) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=invalid-token`
      );

      const response = await GET(request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Link Expired');
    });

    it('should handle missing token parameter', async () => {
      const request = new NextRequest(`${mockBaseUrl}/api/email/unsubscribe`);

      const response = await GET(request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Invalid Link');
      expect(html).toContain('invalid or has expired');
    });

    it('should handle database errors gracefully', async () => {
      const mockSelect = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockReturnThis();
      const mockIs = jest.fn().mockReturnThis();
      const mockGt = jest.fn().mockReturnThis();
      const mockSingle = jest.fn().mockRejectedValue(new Error('Database connection failed'));

      mockSupabase.from = jest.fn(() => ({
        select: mockSelect,
        eq: mockEq,
        is: mockIs,
        gt: mockGt,
        single: mockSingle,
      })) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=valid-token`
      );

      const response = await GET(request);

      expect(response.status).toBe(500);
      const html = await response.text();
      expect(html).toContain('Error');
      expect(html).toContain('error occurred');
    });

    it('should unsubscribe from all emails when token type is "all"', async () => {
      const allToken: UnsubscribeToken = {
        id: 'token-123',
        user_id: 'user-123',
        token: 'all-token',
        email_type: 'all',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: allToken,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'email_subscriptions') {
          return {
            update: mockUpdate,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=all-token`
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('all emails');
    });

    it('should mark token as used after successful unsubscribe', async () => {
      const validToken: UnsubscribeToken = {
        id: 'token-123',
        user_id: 'user-123',
        token: 'valid-token',
        email_type: 'welcome',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: validToken,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'email_subscriptions') {
          return {
            update: mockUpdate,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=valid-token`
      );

      await GET(request);

      // Verify token was marked as used
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          used_at: expect.any(String),
        })
      );
    });

    it('should update email subscriptions for specific email type', async () => {
      const welcomeToken: UnsubscribeToken = {
        id: 'token-123',
        user_id: 'user-123',
        token: 'welcome-token',
        email_type: 'welcome',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: welcomeToken,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockSubUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockSubUpdate = jest.fn().mockReturnValue({ eq: mockSubUpdateEq });

      const mockTokenUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockTokenUpdate = jest.fn().mockReturnValue({ eq: mockTokenUpdateEq });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: mockSelect,
            update: mockTokenUpdate,
          };
        }
        if (table === 'email_subscriptions') {
          return {
            update: mockSubUpdate,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=welcome-token`
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      const html = await response.text();
      expect(html).toContain('welcome emails');
    });

    it('should include dashboard link in success page', async () => {
      const validToken: UnsubscribeToken = {
        id: 'token-123',
        user_id: 'user-123',
        token: 'valid-token',
        email_type: 'weekly_coaching',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      const mockSingle = jest.fn().mockResolvedValue({
        data: validToken,
        error: null,
      });
      const mockGt = jest.fn().mockReturnValue({ single: mockSingle });
      const mockIs = jest.fn().mockReturnValue({ gt: mockGt });
      const mockEq = jest.fn().mockReturnValue({ is: mockIs });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

      const mockUpdateEq = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockUpdate = jest.fn().mockReturnValue({ eq: mockUpdateEq });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: mockSelect,
            update: mockUpdate,
          };
        }
        if (table === 'email_subscriptions') {
          return {
            update: mockUpdate,
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
        };
      }) as any;

      const request = new NextRequest(
        `${mockBaseUrl}/api/email/unsubscribe?token=valid-token`
      );

      const response = await GET(request);
      const html = await response.text();

      expect(html).toContain('/dashboard');
      expect(html).toContain('Manage Email Preferences');
    });
  });
});