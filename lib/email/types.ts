/**
 * Type definitions for the email system
 * Provides type safety for email subscriptions, logs, and unsubscribe tokens
 */

export type EmailType = 'welcome' | 'weekly_coaching';
export type EmailStatus = 'sent' | 'failed' | 'bounced';
export type UnsubscribeEmailType = EmailType | 'all';

/**
 * Email subscription record from database
 */
export interface EmailSubscription {
  id: string;
  user_id: string;
  email_type: EmailType;
  is_active: boolean;
  weekly_email_count: number;
  last_sent_at: string | null;
  last_email_date: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

/**
 * Email log record from database
 */
export interface EmailLog {
  id: string;
  user_id: string;
  email_type: EmailType;
  email_subject: string;
  resend_id: string | null;
  status: EmailStatus;
  week_number: string | null;
  error_message: string | null;
  sent_at: string;
}

/**
 * Unsubscribe token record from database
 */
export interface UnsubscribeToken {
  id: string;
  user_id: string;
  token: string;
  email_type: UnsubscribeEmailType;
  used_at: string | null;
  expires_at: string;
  created_at: string;
}

/**
 * User data needed for email generation
 */
export interface EmailUser {
  id: string;
  email: string;
  name: string;
  top_5_strengths: string[];
}

/**
 * Team member data needed for email generation
 */
export interface EmailTeamMember {
  id: string;
  name: string;
  top_5_strengths: string[];
}

/**
 * Insert types for database operations
 */
export interface EmailSubscriptionInsert {
  user_id: string;
  email_type: EmailType;
  is_active: boolean;
  timezone: string;
}

export interface EmailLogInsert {
  user_id: string;
  email_type: EmailType;
  email_subject: string;
  resend_id: string | undefined;
  status: EmailStatus;
  week_number?: string;
  error_message?: string;
}

export interface UnsubscribeTokenInsert {
  user_id: string;
  token: string;
  email_type: UnsubscribeEmailType;
  expires_at: string;
}

/**
 * Update types for database operations
 */
export interface EmailSubscriptionUpdate {
  is_active?: boolean;
  weekly_email_count?: number;
  last_sent_at?: string;
  last_email_date?: string;
  updated_at: string;
}

export interface UnsubscribeTokenUpdate {
  used_at: string;
}