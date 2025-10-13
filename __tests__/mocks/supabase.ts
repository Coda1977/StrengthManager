import { User, Session } from '@supabase/supabase-js'

// Mock user data
export const mockUser: User = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAdminUser: User = {
  id: 'admin-user-id',
  email: 'admin@example.com',
  app_metadata: { role: 'admin' },
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockSession: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() / 1000 + 3600,
  token_type: 'bearer',
  user: mockUser,
}

// Mock Supabase client
export const createMockSupabaseClient = () => {
  const mockFrom = jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    contains: jest.fn().mockReturnThis(),
    containedBy: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
  }))

  return {
    from: mockFrom,
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
      getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      updateUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
      resetPasswordForEmail: jest.fn().mockResolvedValue({ error: null }),
      verifyOtp: jest.fn().mockResolvedValue({ data: { user: mockUser, session: mockSession }, error: null }),
      refreshSession: jest.fn().mockResolvedValue({ data: { session: mockSession }, error: null }),
    },
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
  }
}

// Mock server-side Supabase client
export const createMockServerClient = () => {
  return createMockSupabaseClient()
}

// Mock data for testing
export const mockUserProfile = {
  id: 'test-user-id',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'user',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockStrengths = [
  { id: 1, name: 'Achiever', theme: 'Executing' },
  { id: 2, name: 'Activator', theme: 'Influencing' },
  { id: 3, name: 'Adaptability', theme: 'Relationship Building' },
  { id: 4, name: 'Analytical', theme: 'Strategic Thinking' },
  { id: 5, name: 'Arranger', theme: 'Executing' },
]

export const mockUserStrengths = [
  {
    id: 'us-1',
    user_id: 'test-user-id',
    strength_id: 1,
    rank: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'us-2',
    user_id: 'test-user-id',
    strength_id: 2,
    rank: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
]

export const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  description: 'A test team',
  created_by: 'test-user-id',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockTeamMember = {
  id: 'tm-1',
  team_id: 'team-1',
  user_id: 'test-user-id',
  role: 'member',
  joined_at: '2024-01-01T00:00:00Z',
}

export const mockConversation = {
  id: 'conv-1',
  user_id: 'test-user-id',
  title: 'Test Conversation',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

export const mockMessage = {
  id: 'msg-1',
  conversation_id: 'conv-1',
  role: 'user',
  content: 'Test message',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockEmailLog = {
  id: 'email-1',
  user_id: 'test-user-id',
  email_type: 'weekly_coaching',
  subject: 'Test Email',
  status: 'sent',
  sent_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
}

export const mockAIUsageLog = {
  id: 'ai-1',
  user_id: 'test-user-id',
  feature: 'chat',
  model: 'claude-3-5-sonnet-20241022',
  input_tokens: 100,
  output_tokens: 50,
  total_tokens: 150,
  cost: 0.001,
  created_at: '2024-01-01T00:00:00Z',
}