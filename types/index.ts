// CliftonStrengths Types
export type StrengthDomain = 'Executing' | 'Influencing' | 'Relationship Building' | 'Strategic Thinking';

export interface Strength {
  id: string;
  name: string;
  domain: StrengthDomain;
  description: string;
  keywords: string[];
  detailedInfo?: {
    whatItMeans: string;
    howToUseIt: string;
    watchOutFor: string;
    worksWith: string[];
  };
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  top5Strengths: string[];
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

// Team Member Types
export interface TeamMember {
  id: string;
  userId: string;
  name: string;
  top5Strengths: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Chat Types
export type ChatMode = 'my-strengths' | 'team-strengths';

export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  mode: ChatMode;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

// Analytics Types
export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: 'chat_message' | 'email_sent' | 'login' | 'feature_used';
  metadata?: Record<string, any>;
  timestamp: string;
}

// Email Preferences Types
export interface EmailPreferences {
  id: string;
  userId: string;
  frequency: 'weekly' | 'biweekly' | 'monthly';
  paused: boolean;
  lastSent?: string;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Types
export interface DomainBalance {
  executing: number;
  influencing: number;
  relationshipBuilding: number;
  strategicThinking: number;
}

export interface TeamAnalytics {
  totalMembers: number;
  domainBalance: DomainBalance;
  topStrengths: { name: string; count: number }[];
  strengthDistribution: { strength: string; members: string[] }[];
}

// Synergy Types
export interface SynergyTip {
  type: 'team' | 'partnership';
  title: string;
  description: string;
  actionItems: string[];
  members?: string[];
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form Types
export interface OnboardingFormData {
  name: string;
  email: string;
  password: string;
  top5Strengths: string[];
}

export interface TeamMemberFormData {
  name: string;
  top5Strengths: string[];
  notes?: string;
}

// Database Types (matching Supabase schema)
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          top_5_strengths: string[];
          role: 'user' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          top_5_strengths: string[];
          role?: 'user' | 'admin';
        };
        Update: {
          email?: string;
          name?: string;
          top_5_strengths?: string[];
          role?: 'user' | 'admin';
        };
      };
      team_members: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          top_5_strengths: string[];
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          name: string;
          top_5_strengths: string[];
          notes?: string;
        };
        Update: {
          name?: string;
          top_5_strengths?: string[];
          notes?: string;
        };
      };
      strengths: {
        Row: {
          id: string;
          name: string;
          domain: StrengthDomain;
          description: string;
          keywords: string[];
          detailed_info: any | null;
        };
        Insert: {
          name: string;
          domain: StrengthDomain;
          description: string;
          keywords: string[];
          detailed_info?: any;
        };
        Update: {
          name?: string;
          domain?: StrengthDomain;
          description?: string;
          keywords?: string[];
          detailed_info?: any;
        };
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: ChatMode;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          mode: ChatMode;
        };
        Update: {
          title?: string;
          mode?: ChatMode;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
          timestamp: string;
        };
        Insert: {
          conversation_id: string;
          role: 'user' | 'assistant';
          content: string;
        };
        Update: {
          content?: string;
        };
      };
      analytics_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          metadata: any | null;
          timestamp: string;
        };
        Insert: {
          user_id: string;
          event_type: string;
          metadata?: any;
        };
        Update: {
          event_type?: string;
          metadata?: any;
        };
      };
      email_preferences: {
        Row: {
          id: string;
          user_id: string;
          frequency: 'weekly' | 'biweekly' | 'monthly';
          paused: boolean;
          last_sent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          frequency?: 'weekly' | 'biweekly' | 'monthly';
          paused?: boolean;
          last_sent?: string;
        };
        Update: {
          frequency?: 'weekly' | 'biweekly' | 'monthly';
          paused?: boolean;
          last_sent?: string;
        };
      };
    };
  };
}