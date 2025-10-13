// Mock Anthropic client and responses

export const mockAnthropicResponse = {
  id: 'msg_test123',
  type: 'message' as const,
  role: 'assistant' as const,
  content: [
    {
      type: 'text' as const,
      text: 'This is a mock AI response for testing purposes.',
    },
  ],
  model: 'claude-3-5-sonnet-20241022',
  stop_reason: 'end_turn' as const,
  stop_sequence: null,
  usage: {
    input_tokens: 100,
    output_tokens: 50,
  },
}

export const mockStreamChunk = {
  type: 'content_block_delta' as const,
  index: 0,
  delta: {
    type: 'text_delta' as const,
    text: 'Test ',
  },
}

export const mockStreamResponse = {
  async *[Symbol.asyncIterator]() {
    yield {
      type: 'message_start' as const,
      message: {
        id: 'msg_test123',
        type: 'message' as const,
        role: 'assistant' as const,
        content: [],
        model: 'claude-3-5-sonnet-20241022',
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 100, output_tokens: 0 },
      },
    }
    yield {
      type: 'content_block_start' as const,
      index: 0,
      content_block: { type: 'text' as const, text: '' },
    }
    yield {
      type: 'content_block_delta' as const,
      index: 0,
      delta: { type: 'text_delta' as const, text: 'Test ' },
    }
    yield {
      type: 'content_block_delta' as const,
      index: 0,
      delta: { type: 'text_delta' as const, text: 'response' },
    }
    yield {
      type: 'content_block_stop' as const,
      index: 0,
    }
    yield {
      type: 'message_delta' as const,
      delta: { stop_reason: 'end_turn' as const, stop_sequence: null },
      usage: { output_tokens: 50 },
    }
    yield {
      type: 'message_stop' as const,
    }
  },
}

export const createMockAnthropicClient = () => {
  return {
    messages: {
      create: jest.fn().mockResolvedValue(mockAnthropicResponse),
      stream: jest.fn().mockReturnValue(mockStreamResponse),
    },
  }
}

// Mock AI logger
export const mockAILogger = {
  logUsage: jest.fn().mockResolvedValue(undefined),
  getUsageStats: jest.fn().mockResolvedValue({
    totalTokens: 1000,
    totalCost: 0.01,
    requestCount: 10,
  }),
}

// Mock content generation responses
export const mockGeneratedTitle = 'Understanding Your Strengths'

export const mockGeneratedInsight = {
  insight: 'Your top strength is Achiever, which means you have a constant need for achievement.',
  actionItems: [
    'Set clear daily goals',
    'Track your progress regularly',
    'Celebrate small wins',
  ],
}

export const mockGeneratedEmail = {
  subject: 'Your Weekly Strengths Insight',
  content: '<p>Here is your personalized insight for this week...</p>',
  plainText: 'Here is your personalized insight for this week...',
}

export const mockFollowUpQuestions = [
  'How can I use my Achiever strength in team settings?',
  'What are some potential blind spots of the Achiever strength?',
  'How does Achiever complement other strengths?',
]

export const mockStarterQuestions = [
  'What are my top 5 strengths?',
  'How can I develop my strengths further?',
  'What careers align with my strengths?',
]