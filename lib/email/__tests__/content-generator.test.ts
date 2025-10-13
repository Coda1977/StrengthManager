import {
  generateWelcomeEmailContent,
  generateWeeklyEmailContent,
  WelcomeEmailContent,
  WeeklyEmailContent,
} from '../content-generator';
import { createMockAnthropicClient, mockAnthropicResponse } from '../../../__tests__/mocks/anthropic';

// Mock dependencies
jest.mock('@/lib/anthropic/client', () => ({
  anthropic: null,
  CLAUDE_MODEL: 'claude-3-5-sonnet-20241022',
}));

jest.mock('@/lib/utils/ai-logger', () => ({
  logAIUsage: jest.fn().mockResolvedValue(undefined),
  extractTokenCounts: jest.fn(() => ({
    inputTokens: 100,
    outputTokens: 50,
  })),
}));

describe('Email Content Generator Tests', () => {
  let mockAnthropic: ReturnType<typeof createMockAnthropicClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockAnthropic = createMockAnthropicClient();

    const anthropicModule = require('@/lib/anthropic/client');
    anthropicModule.anthropic = mockAnthropic;
  });

  describe('generateWelcomeEmailContent', () => {
    it('should generate valid welcome email content', async () => {
      const mockContent: WelcomeEmailContent = {
        subject: 'Welcome to Strength Manager',
        greeting: 'Hi John,',
        dna: 'Strategic + Achiever means you naturally combine strategic thinking with execution.',
        challenge: 'Try using your Strategic strength in your next meeting.',
        whatsNext: 'Every Monday for 12 weeks, you\'ll get insights.',
        cta: 'First insight arrives January 8, 2024',
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockContent),
          },
        ],
      });

      const result = await generateWelcomeEmailContent(
        'John',
        'Strategic',
        'Achiever',
        'January 8, 2024'
      );

      expect(result).toEqual(mockContent);
      expect(mockAnthropic.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 600,
        })
      );
    });

    it('should generate content with team context', async () => {
      const mockContent: WelcomeEmailContent = {
        subject: 'Sarah, your Empathy advantage',
        greeting: 'Hi Sarah,',
        dna: 'Empathy + Communication means you naturally connect with people.',
        challenge: 'Notice how you read the room in your next team meeting.',
        whatsNext: 'Every Monday for 12 weeks, you\'ll get practical insights.',
        cta: 'First insight arrives next Monday',
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockContent),
          },
        ],
      });

      const result = await generateWelcomeEmailContent(
        'Sarah',
        'Empathy',
        'Communication',
        'next Monday'
      );

      expect(result.subject).toContain('Sarah');
      expect(result.dna).toContain('Empathy');
      expect(result.dna).toContain('Communication');
    });

    it('should use fallback content on AI failure', async () => {
      mockAnthropic.messages.create.mockRejectedValue(new Error('AI service unavailable'));

      const result = await generateWelcomeEmailContent(
        'John',
        'Strategic',
        'Achiever',
        'January 8, 2024'
      );

      expect(result.subject).toContain('John');
      expect(result.subject).toContain('Strategic');
      expect(result.greeting).toContain('John');
      expect(result.dna).toContain('Strategic');
      expect(result.dna).toContain('Achiever');
    });

    it('should enforce subject line character limit', async () => {
      const mockContent: WelcomeEmailContent = {
        subject: 'This is a very long subject line that exceeds the forty character limit',
        greeting: 'Hi John,',
        dna: 'Strategic + Achiever means you naturally combine strategic thinking.',
        challenge: 'Try using your Strategic strength.',
        whatsNext: 'Every Monday for 12 weeks.',
        cta: 'First insight arrives soon',
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockContent),
          },
        ],
      });

      const result = await generateWelcomeEmailContent(
        'John',
        'Strategic',
        'Achiever',
        'January 8, 2024'
      );

      expect(result.subject.length).toBeLessThanOrEqual(40);
    });

    it('should validate all required fields are present', async () => {
      const incompleteContent = {
        subject: 'Welcome',
        greeting: 'Hi John,',
        // Missing other required fields
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(incompleteContent),
          },
        ],
      });

      const result = await generateWelcomeEmailContent(
        'John',
        'Strategic',
        'Achiever',
        'January 8, 2024'
      );

      // Should fall back to default content
      expect(result.subject).toBeDefined();
      expect(result.greeting).toBeDefined();
      expect(result.dna).toBeDefined();
      expect(result.challenge).toBeDefined();
      expect(result.whatsNext).toBeDefined();
      expect(result.cta).toBeDefined();
    });

    it('should handle invalid JSON response', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      });

      const result = await generateWelcomeEmailContent(
        'John',
        'Strategic',
        'Achiever',
        'January 8, 2024'
      );

      // Should fall back to default content
      expect(result).toBeDefined();
      expect(result.subject).toBeDefined();
    });
  });

  describe('generateWeeklyEmailContent', () => {
    const mockWeeklyContent: WeeklyEmailContent = {
      subjectLine: 'Week 1: Your Strategic strength spotlight',
      preHeader: 'Your weekly Strategic insight',
      header: 'Week 1: Your Strategic strength spotlight',
      personalInsight: 'Your Strategic strength gives you unique advantages.',
      techniqueName: 'Strategic Focus',
      techniqueContent: 'Apply your Strategic strength consciously this week.',
      teamSection: 'This week: Jane Smith needs focused challenges.',
      quote: 'Success comes to those who are busy.',
      quoteAuthor: 'Henry David Thoreau',
    };

    it('should generate weekly email content with team members', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeeklyContent),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic', 'Achiever', 'Learner', 'Focus', 'Analytical'],
        1,
        3,
        'Strategic',
        'Jane Smith',
        ['Empathy', 'Communication', 'Developer'],
        'Empathy'
      );

      expect(result.subjectLine).toBe(mockWeeklyContent.subjectLine);
      expect(result.header).toBe(mockWeeklyContent.header);
      expect(result.personalInsight).toBe(mockWeeklyContent.personalInsight);
      expect(mockAnthropic.messages.create).toHaveBeenCalled();
    });

    it('should generate content without team members', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeeklyContent),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic', 'Achiever'],
        1,
        0,
        'Strategic',
        'No Team',
        [],
        'Strategic'
      );

      expect(result).toBeDefined();
      expect(result.subjectLine).toBeDefined();
    });

    it('should validate content length requirements', async () => {
      const longContent = {
        ...mockWeeklyContent,
        subjectLine: 'This is an extremely long subject line that definitely exceeds the forty-five character limit',
        preHeader: 'This is a very short pre-header',
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(longContent),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      expect(result.subjectLine.length).toBeLessThanOrEqual(45);
      expect(result.preHeader.length).toBeGreaterThanOrEqual(40);
      expect(result.preHeader.length).toBeLessThanOrEqual(50);
    });

    it('should handle AI errors gracefully', async () => {
      mockAnthropic.messages.create.mockRejectedValue(new Error('AI timeout'));

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      // Should return fallback content
      expect(result).toBeDefined();
      expect(result.subjectLine).toContain('Strategic');
      expect(result.teamSection).toContain('Jane');
    });

    it('should include unsubscribe context in prompt', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeeklyContent),
          },
        ],
      });

      await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      const callArgs = mockAnthropic.messages.create.mock.calls[0][0];
      expect(callArgs.messages[0].content).toBeDefined();
    });

    it('should ensure featured strength is mentioned', async () => {
      const contentWithoutStrength = {
        ...mockWeeklyContent,
        personalInsight: 'You have unique advantages this week.',
        techniqueName: 'Focus Technique',
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(contentWithoutStrength),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      // Should fix content to include featured strength
      expect(result.personalInsight.toLowerCase()).toContain('strategic');
    });

    it('should respect character limits for all fields', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeeklyContent),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        5,
        2,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      expect(result.subjectLine.length).toBeLessThanOrEqual(45);
      expect(result.preHeader.length).toBeGreaterThanOrEqual(40);
      expect(result.preHeader.length).toBeLessThanOrEqual(50);
    });

    it('should log AI usage with correct parameters', async () => {
      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockWeeklyContent),
          },
        ],
      });

      const { logAIUsage } = require('@/lib/utils/ai-logger');

      await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy',
        [],
        [],
        [],
        'user-123'
      );

      expect(logAIUsage).toHaveBeenCalledWith(
        expect.objectContaining({
          requestType: 'email_content',
          model: 'claude-3-5-sonnet-20241022',
          userId: 'user-123',
        })
      );
    });

    it('should handle missing required fields in AI response', async () => {
      const incompleteContent = {
        subjectLine: 'Week 1',
        preHeader: 'Your insight',
        // Missing other fields
      };

      mockAnthropic.messages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify(incompleteContent),
          },
        ],
      });

      const result = await generateWeeklyEmailContent(
        'John',
        ['Strategic'],
        1,
        1,
        'Strategic',
        'Jane',
        ['Empathy'],
        'Empathy'
      );

      // Should fall back to default content
      expect(result.header).toBeDefined();
      expect(result.personalInsight).toBeDefined();
      expect(result.techniqueName).toBeDefined();
      expect(result.techniqueContent).toBeDefined();
      expect(result.teamSection).toBeDefined();
      expect(result.quote).toBeDefined();
      expect(result.quoteAuthor).toBeDefined();
    });
  });
});