-- Email System Tables Migration
-- Created: 2025-10-13
-- Purpose: Add email subscriptions, logs, and unsubscribe functionality

-- Create email_subscriptions table
CREATE TABLE IF NOT EXISTS public.email_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'weekly_coaching')),
  is_active BOOLEAN DEFAULT TRUE,
  weekly_email_count INTEGER DEFAULT 0,
  last_sent_at TIMESTAMP WITH TIME ZONE,
  last_email_date DATE,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- Create email_logs table
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'weekly_coaching')),
  email_subject TEXT NOT NULL,
  resend_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'bounced')),
  week_number TEXT,
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unsubscribe_tokens table
CREATE TABLE IF NOT EXISTS public.unsubscribe_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('welcome', 'weekly_coaching', 'all')),
  used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON public.email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_active ON public.email_subscriptions(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_type ON public.email_subscriptions(email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_type ON public.email_logs(email_type);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_token ON public.unsubscribe_tokens(token);
CREATE INDEX IF NOT EXISTS idx_unsubscribe_tokens_user_id ON public.unsubscribe_tokens(user_id);

-- Add trigger for updated_at on email_subscriptions
CREATE TRIGGER update_email_subscriptions_updated_at 
  BEFORE UPDATE ON public.email_subscriptions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.email_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unsubscribe_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_subscriptions
CREATE POLICY "Users can view own email subscriptions" 
  ON public.email_subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own email subscriptions" 
  ON public.email_subscriptions
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email subscriptions" 
  ON public.email_subscriptions
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all email subscriptions" 
  ON public.email_subscriptions
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for email_logs
CREATE POLICY "Users can view own email logs" 
  ON public.email_logs
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert email logs" 
  ON public.email_logs
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Admins can view all email logs" 
  ON public.email_logs
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for unsubscribe_tokens
CREATE POLICY "Users can view own unsubscribe tokens" 
  ON public.unsubscribe_tokens
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert unsubscribe tokens" 
  ON public.unsubscribe_tokens
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "System can update unsubscribe tokens" 
  ON public.unsubscribe_tokens
  FOR UPDATE 
  USING (true);

-- Comments for documentation
COMMENT ON TABLE public.email_subscriptions IS 'Tracks user email subscription preferences and weekly email status';
COMMENT ON TABLE public.email_logs IS 'Logs all sent emails for debugging and analytics';
COMMENT ON TABLE public.unsubscribe_tokens IS 'Secure tokens for email unsubscribe functionality';
COMMENT ON COLUMN public.email_subscriptions.weekly_email_count IS 'Number of weekly emails sent (max 12)';
COMMENT ON COLUMN public.email_subscriptions.last_email_date IS 'Date of last email sent (for daily limit protection)';
COMMENT ON COLUMN public.email_logs.resend_id IS 'Resend API email ID for tracking';