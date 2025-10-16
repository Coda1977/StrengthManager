-- Migration to restore missing admin RLS policies
-- The optimization migration (20241015000000) accidentally removed the admin view policy for users table

-- ============================================================================
-- USERS TABLE - Restore admin view policy
-- ============================================================================

-- Restore the "Admins can view all users" policy that was dropped but not recreated
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- TEAM_MEMBERS TABLE - Add missing admin policies
-- ============================================================================

-- Admins should be able to view all team members for admin dashboard
CREATE POLICY "Admins can view all team members" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- CHAT_CONVERSATIONS TABLE - Add missing admin policies
-- ============================================================================

-- Admins should be able to view all conversations for monitoring/support
CREATE POLICY "Admins can view all conversations" ON public.chat_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- CHAT_MESSAGES TABLE - Add missing admin policies
-- ============================================================================

-- Admins should be able to view all messages for monitoring/support
CREATE POLICY "Admins can view all messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- EMAIL_PREFERENCES TABLE - Add missing admin policies
-- ============================================================================

-- Admins should be able to view all email preferences for admin dashboard
CREATE POLICY "Admins can view all email preferences" ON public.email_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- Admins should be able to update email preferences for support purposes
CREATE POLICY "Admins can update all email preferences" ON public.email_preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- UNSUBSCRIBE_TOKENS TABLE - Add missing admin policies
-- ============================================================================

-- Admins should be able to view all unsubscribe tokens for monitoring
CREATE POLICY "Admins can view all unsubscribe tokens" ON public.unsubscribe_tokens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

-- ============================================================================
-- NOTES ON EXISTING ADMIN POLICIES
-- ============================================================================

-- The following tables already have admin policies merged with user policies:
-- 1. analytics_events - "Users can view own analytics" includes admin check (line 115-122 in optimization migration)
-- 2. email_subscriptions - "Users can view own email subscriptions" includes admin check (line 156-163)
-- 3. email_logs - "Users can view own email logs" includes admin check (line 177-184)
-- 4. ai_usage_logs - "Admins can view all AI usage logs" exists (line 205-211)

-- These merged policies are sufficient and don't need separate admin policies.