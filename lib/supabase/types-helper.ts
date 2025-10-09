import type { Database } from '@/types';

// Helper types for database operations
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types
export type UserRow = Tables<'users'>;
export type UserInsert = Inserts<'users'>;
export type UserUpdate = Updates<'users'>;

export type TeamMemberRow = Tables<'team_members'>;
export type TeamMemberInsert = Inserts<'team_members'>;
export type TeamMemberUpdate = Updates<'team_members'>;

export type StrengthRow = Tables<'strengths'>;
export type StrengthInsert = Inserts<'strengths'>;

export type ChatConversationRow = Tables<'chat_conversations'>;
export type ChatConversationInsert = Inserts<'chat_conversations'>;
export type ChatConversationUpdate = Updates<'chat_conversations'>;

export type ChatMessageRow = Tables<'chat_messages'>;
export type ChatMessageInsert = Inserts<'chat_messages'>;

export type AnalyticsEventRow = Tables<'analytics_events'>;
export type AnalyticsEventInsert = Inserts<'analytics_events'>;

export type EmailPreferencesRow = Tables<'email_preferences'>;
export type EmailPreferencesInsert = Inserts<'email_preferences'>;
export type EmailPreferencesUpdate = Updates<'email_preferences'>;