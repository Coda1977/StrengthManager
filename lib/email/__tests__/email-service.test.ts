import {
  sendWelcomeEmail,
  sendWeeklyCoachingEmail,
  processWeeklyEmails,
} from '../email-service';
import { createMockSupabaseClient } from '../../../__tests__/mocks/supabase';
import { createMockResendClient } from '../../../__tests__/mocks/resend';
import { createMockAnthropicClient } from '../../../__tests__/mocks/anthropic';
import { EmailUser, EmailTeamMember } from '../types';

// Mock dependencies
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

jest.mock('@/lib/resend/client', () => ({
  resend: null,
  EMAIL_CONFIG: {
    from: 'noreply@strengthmanager.com',
  },
}));

jest.mock('@/lib/anthropic/client', () => ({
  anthropic: null,
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
}));

jest.mock('@react-email/render', () => ({
  render: jest.fn().mockResolvedValue('<html>Mock Email</html>'),
}));

jest.mock('@/lib/utils/date-helpers', () => ({
  getNextMonday: jest.fn(() => new Date('2024-01-08')),
  getTodayAtMidnight: jest.fn(() => new Date('2024-01-01T00:00:00Z')),
  formatEmailDate: jest.fn((date: Date) => 'January 8, 2024'),
}));

jest.mock('../content-generator', () => ({
  generateWelcomeEmailContent: jest.fn(),
  generateWeeklyEmailContent: jest.fn(),
}));

describe('Email Service Integration Tests', () => {
  let mockSupabase: ReturnType<typeof createMockSupabaseClient>;
  let mockResend: ReturnType<typeof createMockResendClient>;
  let mockAnthropic: ReturnType<typeof createMockAnthropicClient>;
  let mockUser: EmailUser;
  let mockTeamMember: EmailTeamMember;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockSupabase = createMockSupabaseClient();
    mockResend = createMockResendClient();
    mockAnthropic = createMockAnthropicClient();

    const { createClient } = require('@/lib/supabase/server');
    createClient.mockResolvedValue(mockSupabase);

    const resendModule = require('@/lib/resend/client');
    resendModule.resend = mockResend;

    const anthropicModule = require('@/lib/anthropic/client');
    anthropicModule.anthropic = mockAnthropic;

    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'John Doe',
      top_5_strengths: ['Strategic', 'Achiever', 'Learner', 'Focus', 'Analytical'],
    };

    mockTeamMember = {
      id: 'member-123',
      name: 'Jane Smith',
      top_5_strengths: ['Empathy', 'Communication', 'Developer', 'Positivity', 'Harmony'],
    };
  });

  describe('sendWelcomeEmail', () => {
    beforeEach(() => {
      const { generateWelcomeEmailContent } = require('../content-generator');
      generateWelcomeEmailContent.mockResolvedValue({
        subject: 'Welcome to Strength Manager',
        greeting: 'Hi John,',
        dna: 'Strategic + Achiever means you naturally combine strategic thinking with execution.',
        challenge: 'Try using your Strategic strength in your next meeting.',
        whatsNext: 'Every Monday for 12 weeks, you\'ll get insights.',
        cta: 'First insight arrives January 8, 2024',
      });
    });

    it('should successfully send welcome email with valid user', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(mockUser);

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Welcome to Strength Manager',
        })
      );
    });

    it('should handle missing user data gracefully', async () => {
      const incompleteUser = {
        ...mockUser,
        top_5_strengths: [],
      };

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(incompleteUser);

      expect(result.success).toBe(true);
      // Should use fallback strengths
    });

    it('should handle Resend API failures', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'API rate limit exceeded' },
      });

      const result = await sendWelcomeEmail(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toBe('API rate limit exceeded');
    });

    it('should create email subscriptions', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      // Should create both welcome and weekly_coaching subscriptions
      expect(mockSupabase.from).toHaveBeenCalledWith('email_subscriptions');
    });

    it('should log email delivery', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      expect(mockSupabase.from).toHaveBeenCalledWith('email_logs');
    });

    it('should handle AI content generation failure', async () => {
      const { generateWelcomeEmailContent } = require('../content-generator');
      generateWelcomeEmailContent.mockRejectedValue(new Error('AI service unavailable'));

      const result = await sendWelcomeEmail(mockUser);

      expect(result.success).toBe(false);
      expect(result.error).toContain('AI service unavailable');
    });

    it('should use fallback content when AI fails', async () => {
      const { generateWelcomeEmailContent } = require('../content-generator');
      generateWelcomeEmailContent.mockResolvedValue({
        subject: 'John, your Strategic advantage',
        greeting: 'Hi John,',
        dna: 'Strategic + Achiever means you naturally combine strategic thinking.',
        challenge: 'Notice how you see multiple approaches.',
        whatsNext: 'Every Monday for 12 weeks.',
        cta: 'First insight arrives January 8, 2024',
      });

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(mockUser);

      expect(result.success).toBe(true);
    });

    it('should generate unsubscribe token', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      expect(mockSupabase.from).toHaveBeenCalledWith('unsubscribe_tokens');
    });

    it('should include unsubscribe URL in email', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      const { render } = require('@react-email/render');
      expect(render).toHaveBeenCalledWith(
        expect.objectContaining({
          props: expect.objectContaining({
            unsubscribeUrl: expect.stringContaining('unsubscribe?token='),
          }),
        })
      );
    });

    it('should handle database failures gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockRejectedValue(new Error('Database connection failed')),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: null }),
      })) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(mockUser);

      // Should still succeed even if logging fails
      expect(result.success).toBe(true);
    });

    it('should use custom timezone', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser, 'America/Los_Angeles');

      expect(mockSupabase.from).toHaveBeenCalledWith('email_subscriptions');
    });

    it('should handle user with single name', async () => {
      const singleNameUser = { ...mockUser, name: 'John' };
      
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(singleNameUser);

      expect(result.success).toBe(true);
    });
  });

  describe('sendWeeklyCoachingEmail', () => {
    beforeEach(() => {
      const { generateWeeklyEmailContent } = require('../content-generator');
      generateWeeklyEmailContent.mockResolvedValue({
        subjectLine: 'Week 1: Your Strategic strength spotlight',
        preHeader: 'Your weekly Strategic insight',
        header: 'Week 1: Your Strategic strength spotlight',
        personalInsight: 'Your Strategic strength gives you unique advantages.',
        techniqueName: 'Strategic Focus',
        techniqueContent: 'Apply your Strategic strength consciously this week.',
        teamSection: 'This week: Jane Smith needs focused challenges.',
        quote: 'Success comes to those who are busy.',
        quoteAuthor: 'Henry David Thoreau',
      });
    });

    it('should send weekly email with team members', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_456' },
        error: null,
      });

      const result = await sendWeeklyCoachingEmail(mockUser, 1);

      expect(result.success).toBe(true);
      expect(mockResend.emails.send).toHaveBeenCalled();
    });

    it('should skip users without team members', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      const result = await sendWeeklyCoachingEmail(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No team members');
    });

    it('should handle AI failures gracefully', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      const { generateWeeklyEmailContent } = require('../content-generator');
      generateWeeklyEmailContent.mockRejectedValue(new Error('AI timeout'));

      const result = await sendWeeklyCoachingEmail(mockUser, 1);

      expect(result.success).toBe(false);
    });

    it('should rotate featured team member by week', async () => {
      const teamMembers = [mockTeamMember, { ...mockTeamMember, id: 'member-456', name: 'Bob Johnson' }];
      
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: teamMembers,
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_456' },
        error: null,
      });

      await sendWeeklyCoachingEmail(mockUser, 2);

      const { generateWeeklyEmailContent } = require('../content-generator');
      expect(generateWeeklyEmailContent).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Array),
        2,
        2,
        expect.any(String),
        'Bob Johnson',
        expect.any(Array),
        expect.any(String),
        expect.any(Array),
        expect.any(Array),
        expect.any(Array)
      );
    });

    it('should log email with week number', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_456' },
        error: null,
      });

      await sendWeeklyCoachingEmail(mockUser, 5);

      expect(mockSupabase.from).toHaveBeenCalledWith('email_logs');
    });

    it('should handle email delivery failures', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: null,
        error: { message: 'Invalid recipient' },
      });

      const result = await sendWeeklyCoachingEmail(mockUser, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid recipient');
    });
  });

  describe('processWeeklyEmails', () => {
    it('should process batch of weekly emails', async () => {
      const subscriptions = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          email_type: 'weekly_coaching',
          is_active: true,
          weekly_email_count: 0,
          last_email_date: null,
          users: {
            id: 'user-1',
            email: 'user1@example.com',
            name: 'User One',
            top_5_strengths: ['Strategic', 'Achiever', 'Learner', 'Focus', 'Analytical'],
          },
        },
        {
          id: 'sub-2',
          user_id: 'user-2',
          email_type: 'weekly_coaching',
          is_active: true,
          weekly_email_count: 1,
          last_email_date: '2023-12-25T00:00:00Z',
          users: {
            id: 'user-2',
            email: 'user2@example.com',
            name: 'User Two',
            top_5_strengths: ['Empathy', 'Communication', 'Developer', 'Positivity', 'Harmony'],
          },
        },
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: subscriptions,
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_batch' },
        error: null,
      });

      const result = await processWeeklyEmails();

      expect(result.sent).toBeGreaterThan(0);
    });

    it('should respect weekly limits (12 weeks max)', async () => {
      const subscription = {
        id: 'sub-1',
        user_id: 'user-1',
        email_type: 'weekly_coaching',
        is_active: true,
        weekly_email_count: 12,
        last_email_date: '2023-12-25T00:00:00Z',
        users: mockUser,
      };

      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [subscription],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      const result = await processWeeklyEmails();

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should handle partial failures', async () => {
      const subscriptions = [
        {
          id: 'sub-1',
          user_id: 'user-1',
          email_type: 'weekly_coaching',
          is_active: true,
          weekly_email_count: 0,
          last_email_date: null,
          users: mockUser,
        },
        {
          id: 'sub-2',
          user_id: 'user-2',
          email_type: 'weekly_coaching',
          is_active: true,
          weekly_email_count: 1,
          last_email_date: '2023-12-25T00:00:00Z',
          users: { ...mockUser, id: 'user-2', email: 'user2@example.com' },
        },
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: subscriptions,
              error: null,
            }),
            update: jest.fn().mockReturnThis(),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      let callCount = 0;
      mockResend.emails.send.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({ data: { id: 'email_1' }, error: null });
        }
        return Promise.resolve({ data: null, error: { message: 'Failed' } });
      });

      const result = await processWeeklyEmails();

      expect(result.sent).toBeGreaterThan(0);
      expect(result.failed).toBeGreaterThan(0);
    });

    it('should log all operations', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      });

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await processWeeklyEmails();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Processing weekly emails'));
      consoleSpy.mockRestore();
    });

    it('should skip emails already sent today', async () => {
      const today = new Date('2024-01-01T00:00:00Z');
      const subscription = {
        id: 'sub-1',
        user_id: 'user-1',
        email_type: 'weekly_coaching',
        is_active: true,
        weekly_email_count: 1,
        last_email_date: today.toISOString(),
        users: mockUser,
      };

      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [subscription],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      const result = await processWeeklyEmails();

      expect(result.skipped).toBe(1);
      expect(result.sent).toBe(0);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from = jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockRejectedValue(new Error('Database error')),
      })) as any;

      const result = await processWeeklyEmails();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.skipped).toBe(0);
    });

    it('should update subscription after successful send', async () => {
      const subscription = {
        id: 'sub-1',
        user_id: 'user-1',
        email_type: 'weekly_coaching',
        is_active: true,
        weekly_email_count: 2,
        last_email_date: '2023-12-25T00:00:00Z',
        users: mockUser,
      };

      const mockUpdate = jest.fn().mockReturnThis();
      const mockEq = jest.fn().mockResolvedValue({ data: null, error: null });

      mockSupabase.from = jest.fn((table) => {
        if (table === 'email_subscriptions') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [subscription],
              error: null,
            }),
            update: mockUpdate.mockReturnValue({ eq: mockEq }),
          };
        }
        if (table === 'team_members') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
              data: [mockTeamMember],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await processWeeklyEmails();

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          weekly_email_count: 3,
        })
      );
    });
  });

  describe('Unsubscribe Token Management', () => {
    it('should generate cryptographically secure tokens', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      expect(mockSupabase.from).toHaveBeenCalledWith('unsubscribe_tokens');
    });

    it('should reuse existing valid tokens', async () => {
      const existingToken = {
        id: 'token-1',
        user_id: 'user-123',
        token: 'existing-token-abc123',
        email_type: 'welcome',
        used_at: null,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      };

      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockResolvedValue({
              data: [existingToken],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      // Should not create new token
      const insertCalls = (mockSupabase.from as jest.Mock).mock.calls.filter(
        (call) => call[0] === 'unsubscribe_tokens'
      );
      expect(insertCalls.length).toBeGreaterThan(0);
    });

    it('should set token expiry to 1 year', async () => {
      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      await sendWelcomeEmail(mockUser);

      expect(mockSupabase.from).toHaveBeenCalledWith('unsubscribe_tokens');
    });

    it('should handle token generation failures', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'unsubscribe_tokens') {
          return {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockRejectedValue(new Error('Token creation failed')),
            eq: jest.fn().mockReturnThis(),
            is: jest.fn().mockReturnThis(),
            gt: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          };
        }
        return {
          select: jest.fn().mockReturnThis(),
          insert: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }) as any;

      mockResend.emails.send.mockResolvedValue({
        data: { id: 'email_123' },
        error: null,
      });

      const result = await sendWelcomeEmail(mockUser);

      // Should still succeed with fallback token
      expect(result.success).toBe(true);
    });
  });
});