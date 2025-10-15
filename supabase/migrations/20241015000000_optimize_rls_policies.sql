-- Migration to optimize RLS policies for better performance
-- Wraps auth.uid() and auth.role() calls in SELECT to prevent re-evaluation per row

-- ============================================================================
-- USERS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate with optimized queries
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- ============================================================================
-- TEAM_MEMBERS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON public.team_members;

-- Recreate with optimized queries
CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- STRENGTHS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users can view strengths" ON public.strengths;

-- Recreate with optimized query
CREATE POLICY "Authenticated users can view strengths" ON public.strengths
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- ============================================================================
-- CHAT_CONVERSATIONS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON public.chat_conversations;

-- Recreate with optimized queries
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- CHAT_MESSAGES TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.chat_messages;

-- Recreate with optimized queries
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = (select auth.uid())
    )
  );

-- ============================================================================
-- ANALYTICS_EVENTS TABLE - Optimize RLS policies and merge duplicates
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;

-- Recreate with optimized queries - merge admin and user view policies
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own analytics" ON public.analytics_events
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- ============================================================================
-- EMAIL_PREFERENCES TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can insert own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences;

-- Recreate with optimized queries
CREATE POLICY "Users can view own email preferences" ON public.email_preferences
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can insert own email preferences" ON public.email_preferences
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own email preferences" ON public.email_preferences
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- EMAIL_SUBSCRIPTIONS TABLE - Optimize RLS policies and merge duplicates
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own email subscriptions" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can update own email subscriptions" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Admins can view all email subscriptions" ON public.email_subscriptions;

-- Recreate with optimized queries - merge admin and user view policies
CREATE POLICY "Users can view own email subscriptions" ON public.email_subscriptions
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own email subscriptions" ON public.email_subscriptions
  FOR UPDATE USING ((select auth.uid()) = user_id);

-- ============================================================================
-- EMAIL_LOGS TABLE - Optimize RLS policies and merge duplicates
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;

-- Recreate with optimized queries - merge admin and user view policies
CREATE POLICY "Users can view own email logs" ON public.email_logs
  FOR SELECT USING (
    (select auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- UNSUBSCRIBE_TOKENS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Users can view own unsubscribe tokens" ON public.unsubscribe_tokens;

-- Recreate with optimized query
CREATE POLICY "Users can view own unsubscribe tokens" ON public.unsubscribe_tokens
  FOR SELECT USING ((select auth.uid()) = user_id);

-- ============================================================================
-- AI_USAGE_LOGS TABLE - Optimize RLS policies
-- ============================================================================

-- Drop existing policy
DROP POLICY IF EXISTS "Admins can view all AI usage logs" ON public.ai_usage_logs;

-- Recreate with optimized query
CREATE POLICY "Admins can view all AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );