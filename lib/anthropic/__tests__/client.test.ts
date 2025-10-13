import { logAIUsage, extractTokenCounts } from '@/lib/utils/ai-logger';
import { mockAnthropicResponse, mockStreamResponse } from '@/__tests__/mocks/anthropic';

// Mock dependencies BEFORE importing the module under test
jest.mock('@/lib/utils/ai-logger');

// Create mock instance that will be used by the Anthropic SDK mock
const mockMessages = {
  create: jest.fn(),
  stream: jest.fn(),
};

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: mockMessages,
  }));
});

// NOW import the module under test
import {
  streamChatResponse,
  generateConversationTitle,
  generateWeeklyTips,
  generateSynergyTip,
  CLAUDE_MODEL,
  SYSTEM_PROMPTS,
  generateSuggestedQuestions
} from '../client';

const mockLogAIUsage = logAIUsage as jest.MockedFunction<typeof logAIUsage>;
const mockExtractTokenCounts = extractTokenCounts as jest.MockedFunction<typeof extractTokenCounts>;

describe('Anthropic Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExtractTokenCounts.mockReturnValue({
      inputTokens: 100,
      outputTokens: 50,
    });
    
    // Reset mock implementations
    mockMessages.create.mockResolvedValue(mockAnthropicResponse as any);
    mockMessages.stream.mockReturnValue({
      ...mockStreamResponse,
      finalMessage: jest.fn().mockResolvedValue(mockAnthropicResponse),
    } as any);
  });

  describe('generateSuggestedQuestions', () => {
    it('generates my-strengths questions with user strengths', () => {
      const questions = generateSuggestedQuestions(
        'my-strengths',
        ['Achiever', 'Strategic', 'Learner', 'Ideation', 'Input']
      );

      expect(questions).toHaveLength(4);
      expect(questions[0]).toContain('Achiever');
      expect(questions[1]).toContain('blind spots');
      expect(questions[2]).toContain('leadership style');
      expect(questions[3]).toContain('Achiever');
    });

    it('generates team-strengths questions with team members', () => {
      const teamMembers = [
        { name: 'John', strengths: ['Achiever', 'Strategic'] },
        { name: 'Jane', strengths: ['Empathy', 'Developer'] },
      ];

      const questions = generateSuggestedQuestions(
        'team-strengths',
        ['Achiever', 'Strategic', 'Learner', 'Ideation', 'Input'],
        teamMembers
      );

      expect(questions).toHaveLength(4);
      expect(questions[0]).toContain('delegate');
      expect(questions[1]).toContain('John');
      expect(questions[2]).toContain('collaboration');
      expect(questions[3]).toContain('dynamics');
    });

    it('generates team-strengths questions without team members', () => {
      const questions = generateSuggestedQuestions(
        'team-strengths',
        ['Achiever', 'Strategic', 'Learner', 'Ideation', 'Input'],
        []
      );

      expect(questions).toHaveLength(4);
      expect(questions[1]).toContain('strengths gaps');
    });
  });

  describe('SYSTEM_PROMPTS', () => {
    it('creates my-strengths prompt with user strengths', () => {
      const strengths = ['Achiever', 'Strategic', 'Learner'];
      const prompt = SYSTEM_PROMPTS['my-strengths'](strengths);

      expect(prompt).toContain('Achiever');
      expect(prompt).toContain('Strategic');
      expect(prompt).toContain('Learner');
      expect(prompt).toContain('CliftonStrengths expert coach');
      expect(prompt).toContain('actionable');
    });

    it('creates team-strengths prompt with team context', () => {
      const userStrengths = ['Achiever', 'Strategic'];
      const teamMembers = [
        { name: 'John', strengths: ['Empathy', 'Developer'] },
        { name: 'Jane', strengths: ['Competition', 'Significance'] },
      ];

      const prompt = SYSTEM_PROMPTS['team-strengths'](userStrengths, teamMembers);

      expect(prompt).toContain('Achiever');
      expect(prompt).toContain('John');
      expect(prompt).toContain('Jane');
      expect(prompt).toContain('Empathy');
      expect(prompt).toContain('Competition');
      expect(prompt).toContain('team dynamics');
    });
  });

  describe('streamChatResponse', () => {
    it('streams chat response with valid messages', async () => {
      const messages = [
        { role: 'user' as const, content: 'How can I use my Achiever strength?' },
      ];
      const systemPrompt = 'You are a coach';

      const stream = await streamChatResponse(messages, systemPrompt);

      expect(mockMessages.stream).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'How can I use my Achiever strength?' }],
      });
      expect(stream).toBeDefined();
    });

    it('logs token usage correctly after stream completes', async () => {
      const messages = [{ role: 'user' as const, content: 'Test message' }];
      const systemPrompt = 'Test prompt';
      const userId = 'user-123';
      const conversationId = 'conv-456';

      await streamChatResponse(messages, systemPrompt, userId, conversationId);

      // Wait for finalMessage promise to resolve
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockExtractTokenCounts).toHaveBeenCalledWith(mockAnthropicResponse);
      expect(mockLogAIUsage).toHaveBeenCalledWith({
        requestType: 'chat',
        model: CLAUDE_MODEL,
        inputTokens: 100,
        outputTokens: 50,
        userId,
        conversationId,
      });
    });

    it('handles stream with my-strengths mode', async () => {
      const messages = [
        { role: 'user' as const, content: 'What are my blind spots?' },
      ];
      const systemPrompt = SYSTEM_PROMPTS['my-strengths'](['Achiever', 'Strategic']);

      const stream = await streamChatResponse(messages, systemPrompt, 'user-123');

      expect(mockMessages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('Achiever'),
        })
      );
    });

    it('handles stream with team-strengths mode', async () => {
      const teamMembers = [{ name: 'John', strengths: ['Empathy'] }];
      const messages = [
        { role: 'user' as const, content: 'How should I manage John?' },
      ];
      const systemPrompt = SYSTEM_PROMPTS['team-strengths'](['Achiever'], teamMembers);

      const stream = await streamChatResponse(messages, systemPrompt, 'user-123');

      expect(mockMessages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          system: expect.stringContaining('John'),
        })
      );
    });

    it('handles API errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMessages.stream.mockReturnValue({
        ...mockStreamResponse,
        finalMessage: jest.fn().mockRejectedValue(new Error('API Error')),
      } as any);

      const messages = [{ role: 'user' as const, content: 'Test' }];
      await streamChatResponse(messages, 'Test prompt');

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error logging chat usage:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('streams with multiple messages in conversation history', async () => {
      const messages = [
        { role: 'user' as const, content: 'First message' },
        { role: 'assistant' as const, content: 'First response' },
        { role: 'user' as const, content: 'Second message' },
      ];

      await streamChatResponse(messages, 'Test prompt');

      expect(mockMessages.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'user', content: 'First message' },
            { role: 'assistant', content: 'First response' },
            { role: 'user', content: 'Second message' },
          ]),
        })
      );
    });
  });

  describe('generateConversationTitle', () => {
    it('generates meaningful title from first message', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: 'Understanding Your Achiever Strength' }],
      } as any);

      const title = await generateConversationTitle('How can I use my Achiever strength?');

      expect(mockMessages.create).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 50,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('How can I use my Achiever strength?'),
          },
        ],
      });
      expect(title).toBe('Understanding Your Achiever Strength');
    });

    it('removes quotes from generated title', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: '"Managing Team Dynamics"' }],
      } as any);

      const title = await generateConversationTitle('How do I manage my team?');

      expect(title).toBe('Managing Team Dynamics');
    });

    it('validates title length constraint', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: 'Short Title' }],
      } as any);

      const title = await generateConversationTitle('Test message');

      expect(title.length).toBeLessThanOrEqual(100);
    });

    it('handles AI failures with fallback', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMessages.create.mockRejectedValue(new Error('API Error'));

      const title = await generateConversationTitle('Test message');

      expect(title).toBe('New Conversation');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error generating title:',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('handles non-text response content', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'image', source: {} }],
      } as any);

      const title = await generateConversationTitle('Test message');

      expect(title).toBe('New Conversation');
    });

    it('trims whitespace from generated title', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: '  Spaced Title  ' }],
      } as any);

      const title = await generateConversationTitle('Test message');

      expect(title).toBe('Spaced Title');
    });
  });

  describe('generateWeeklyTips', () => {
    it('generates tips with team context', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              personalTip: 'Use your Achiever to set daily goals.',
              teamTip: 'Connect with John about his Empathy strength.',
            }),
          },
        ],
      } as any);

      const teamMembers = [
        { name: 'John', strengths: ['Empathy', 'Developer'] },
        { name: 'Jane', strengths: ['Competition', 'Significance'] },
      ];

      const tips = await generateWeeklyTips(
        'Test User',
        ['Achiever', 'Strategic'],
        teamMembers,
        'user-123'
      );

      expect(mockMessages.create).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('Test User'),
          },
        ],
      });
      expect(tips.personalTip).toBe('Use your Achiever to set daily goals.');
      expect(tips.teamTip).toBe('Connect with John about his Empathy strength.');
    });

    it('generates tips without team members', async () => {
      const tips = await generateWeeklyTips(
        'Test User',
        ['Achiever', 'Strategic'],
        [],
        'user-123'
      );

      expect(tips).toHaveProperty('personalTip');
      expect(tips).toHaveProperty('teamTip');
    });

    it('logs AI usage correctly', async () => {
      await generateWeeklyTips(
        'Test User',
        ['Achiever'],
        [],
        'user-123'
      );

      expect(mockExtractTokenCounts).toHaveBeenCalled();
      expect(mockLogAIUsage).toHaveBeenCalledWith({
        requestType: 'insights',
        model: CLAUDE_MODEL,
        inputTokens: 100,
        outputTokens: 50,
        userId: 'user-123',
      });
    });

    it('handles AI failures with fallback tips', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMessages.create.mockRejectedValue(new Error('API Error'));

      const tips = await generateWeeklyTips(
        'Test User',
        ['Achiever'],
        [],
        'user-123'
      );

      expect(tips.personalTip).toBe('Focus on using your top strength this week.');
      expect(tips.teamTip).toBe('Connect with a team member about their strengths.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('handles malformed JSON response', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: 'Invalid JSON' }],
      } as any);

      const tips = await generateWeeklyTips(
        'Test User',
        ['Achiever'],
        [],
        'user-123'
      );

      expect(tips.personalTip).toBe('Focus on using your top strength this week.');
      expect(tips.teamTip).toBe('Connect with a team member about their strengths.');
      consoleErrorSpy.mockRestore();
    });

    it('handles missing tip fields in response', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'text', text: JSON.stringify({}) }],
      } as any);

      const tips = await generateWeeklyTips(
        'Test User',
        ['Achiever'],
        [],
        'user-123'
      );

      expect(tips.personalTip).toBe('Focus on using your top strength this week.');
      expect(tips.teamTip).toBe('Connect with a team member about their strengths.');
    });
  });

  describe('generateSynergyTip', () => {
    it('generates team synergy tip with valid strengths', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [
          {
            type: 'text',
            text: 'Focus on leveraging complementary strengths for better collaboration.',
          },
        ],
      } as any);

      const context = {
        teamMembers: [
          { name: 'John', strengths: ['Achiever', 'Strategic'] },
          { name: 'Jane', strengths: ['Empathy', 'Developer'] },
        ],
      };

      const tip = await generateSynergyTip('team', context, 'user-123');

      expect(mockMessages.create).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('John'),
          },
        ],
      });
      expect(tip).toContain('complementary strengths');
    });

    it('generates partnership synergy tip', async () => {
      const context = {
        member1: { name: 'John', strengths: ['Achiever', 'Strategic'] },
        member2: { name: 'Jane', strengths: ['Empathy', 'Developer'] },
      };

      const tip = await generateSynergyTip('partnership', context, 'user-123');

      expect(mockMessages.create).toHaveBeenCalledWith({
        model: CLAUDE_MODEL,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: expect.stringContaining('partnership'),
          },
        ],
      });
      expect(tip).toBeDefined();
    });

    it('logs AI usage for synergy tips', async () => {
      const context = {
        teamMembers: [{ name: 'John', strengths: ['Achiever'] }],
      };

      await generateSynergyTip('team', context, 'user-123');

      expect(mockLogAIUsage).toHaveBeenCalledWith({
        requestType: 'synergy_tips',
        model: CLAUDE_MODEL,
        inputTokens: 100,
        outputTokens: 50,
        userId: 'user-123',
      });
    });

    it('handles missing team data gracefully', async () => {
      const tip = await generateSynergyTip('team', {}, 'user-123');

      expect(tip).toBeDefined();
    });

    it('handles AI failures with fallback message', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockMessages.create.mockRejectedValue(new Error('API Error'));

      const context = {
        teamMembers: [{ name: 'John', strengths: ['Achiever'] }],
      };

      const tip = await generateSynergyTip('team', context, 'user-123');

      expect(tip).toBe('Focus on leveraging complementary strengths.');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('handles non-text response content', async () => {
      mockMessages.create.mockResolvedValue({
        ...mockAnthropicResponse,
        content: [{ type: 'image', source: {} }],
      } as any);

      const context = {
        teamMembers: [{ name: 'John', strengths: ['Achiever'] }],
      };

      const tip = await generateSynergyTip('team', context, 'user-123');

      expect(tip).toBe('Focus on leveraging complementary strengths.');
    });
  });
});