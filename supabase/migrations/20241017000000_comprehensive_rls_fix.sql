-- =====================================================================================
-- Migration: Comprehensive RLS Policy Fix
-- Created: 2024-10-17
-- 
-- Purpose:
--   This migration comprehensively fixes all RLS (Row Level Security) policy issues
--   identified in the architectural analysis:
--   1. Eliminates infinite recursion in is_admin() function
--   2. Adds missing DELETE policies across all tables
--   3. Ensures complete CRUD coverage for all tables
--   4. Implements role synchronization between public.users and auth.users
--
-- Tables Affected:
--   - users
--   - team_members
--   - chat_conversations
--   - chat_messages
--   - email_preferences
--   - email_subscriptions
--   - email_logs
--   - unsubscribe_tokens
--   - ai_usage_logs
--   - analytics_events
--   - strengths
--
-- Breaking Changes:
--   - All existing RLS policies will be dropped and recreated
--   - is_admin() function now reads from auth.users metadata instead of public.users
--   - Role changes in public.users will automatically sync to auth.users
--
-- =====================================================================================

-- =====================================================================================
-- PART 1: ONE-TIME DATA SYNC
-- Sync existing role data from public.users to auth.users metadata
-- =====================================================================================

-- Update auth.users metadata with role from public.users
UPDATE auth.users au
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', u.role)
FROM public.users u
WHERE au.id = u.id;

-- =====================================================================================
-- PART 2: DROP ALL EXISTING POLICIES
-- Clean slate approach - remove all existing policies before recreating
-- =====================================================================================

-- Drop policies on users table
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
DROP POLICY IF EXISTS "users_delete" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

-- Drop policies on team_members table
DROP POLICY IF EXISTS "team_members_select" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;
DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;

-- Drop policies on chat_conversations table
DROP POLICY IF EXISTS "chat_conversations_select" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_insert" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_update" ON public.chat_conversations;
DROP POLICY IF EXISTS "chat_conversations_delete" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can view own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON public.chat_conversations;

-- Drop policies on chat_messages table
DROP POLICY IF EXISTS "chat_messages_select" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_update" ON public.chat_messages;
DROP POLICY IF EXISTS "chat_messages_delete" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON public.chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in own conversations" ON public.chat_messages;

-- Drop policies on email_preferences table
DROP POLICY IF EXISTS "email_preferences_select" ON public.email_preferences;
DROP POLICY IF EXISTS "email_preferences_insert" ON public.email_preferences;
DROP POLICY IF EXISTS "email_preferences_update" ON public.email_preferences;
DROP POLICY IF EXISTS "email_preferences_delete" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can view own email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Users can update own email preferences" ON public.email_preferences;

-- Drop policies on email_subscriptions table
DROP POLICY IF EXISTS "email_subscriptions_select" ON public.email_subscriptions;
DROP POLICY IF EXISTS "email_subscriptions_insert" ON public.email_subscriptions;
DROP POLICY IF EXISTS "email_subscriptions_update" ON public.email_subscriptions;
DROP POLICY IF EXISTS "email_subscriptions_delete" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.email_subscriptions;
DROP POLICY IF EXISTS "System can insert subscriptions" ON public.email_subscriptions;

-- Drop policies on email_logs table
DROP POLICY IF EXISTS "email_logs_select" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_insert" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_update" ON public.email_logs;
DROP POLICY IF EXISTS "email_logs_delete" ON public.email_logs;
DROP POLICY IF EXISTS "Users can view own email logs" ON public.email_logs;
DROP POLICY IF EXISTS "System can insert email logs" ON public.email_logs;

-- Drop policies on unsubscribe_tokens table
DROP POLICY IF EXISTS "unsubscribe_tokens_select" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "unsubscribe_tokens_insert" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "unsubscribe_tokens_update" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "unsubscribe_tokens_delete" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "Users can view own tokens" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "System can manage tokens" ON public.unsubscribe_tokens;

-- Drop policies on ai_usage_logs table
DROP POLICY IF EXISTS "ai_usage_logs_select" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_insert" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_update" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "ai_usage_logs_delete" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Users can view own AI usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "System can insert AI usage logs" ON public.ai_usage_logs;

-- Drop policies on analytics_events table
DROP POLICY IF EXISTS "analytics_events_select" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_update" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_delete" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can view own analytics" ON public.analytics_events;
DROP POLICY IF EXISTS "Users can insert own analytics" ON public.analytics_events;

-- Drop policies on strengths table
DROP POLICY IF EXISTS "strengths_select" ON public.strengths;
DROP POLICY IF EXISTS "strengths_insert" ON public.strengths;
DROP POLICY IF EXISTS "strengths_update" ON public.strengths;
DROP POLICY IF EXISTS "strengths_delete" ON public.strengths;
DROP POLICY IF EXISTS "Authenticated users can view strengths" ON public.strengths;
DROP POLICY IF EXISTS "Only admins can modify strengths" ON public.strengths;

-- Drop remaining policies that depend on is_admin() function
DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;
DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;
DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Admins can view all email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Admins can update all email preferences" ON public.email_preferences;
DROP POLICY IF EXISTS "Admins can view all unsubscribe tokens" ON public.unsubscribe_tokens;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all email subscriptions" ON public.email_subscriptions;
DROP POLICY IF EXISTS "Admins can view all email logs" ON public.email_logs;
DROP POLICY IF EXISTS "Admins can view all AI usage" ON public.ai_usage_logs;
DROP POLICY IF EXISTS "Admins can view all analytics" ON public.analytics_events;

-- =====================================================================================
-- PART 3: CREATE NON-RECURSIVE is_admin() FUNCTION
-- New implementation reads from auth.users metadata to avoid recursion
-- =====================================================================================

-- Drop old function if it exists (CASCADE to drop dependent policies)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- Create new non-recursive function that checks auth.users metadata
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- Check role from auth.users metadata instead of querying public.users
  -- This eliminates the infinite recursion issue
  RETURN COALESCE(
    (
      SELECT (raw_user_meta_data->>'role')::text = 'admin'
      FROM auth.users
      WHERE id = auth.uid()
    ),
    false
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Add comment explaining the function
COMMENT ON FUNCTION public.is_admin() IS 'Checks if the current user has admin role by reading from auth.users metadata. This avoids infinite recursion by not querying public.users table.';

-- =====================================================================================
-- PART 4: CREATE ROLE SYNC TRIGGER
-- Automatically sync role changes from public.users to auth.users metadata
-- =====================================================================================

-- Function to sync role changes to auth.users
CREATE OR REPLACE FUNCTION public.sync_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update auth.users metadata whenever role changes in public.users
  UPDATE auth.users
  SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Create trigger on public.users table
DROP TRIGGER IF EXISTS sync_role_to_auth_trigger ON public.users;
CREATE TRIGGER sync_role_to_auth_trigger
  AFTER INSERT OR UPDATE OF role ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_role_to_auth();

-- Add comment explaining the trigger
COMMENT ON TRIGGER sync_role_to_auth_trigger ON public.users IS 'Automatically syncs role changes from public.users to auth.users metadata to keep both tables in sync for the is_admin() function.';

-- =====================================================================================
-- PART 5: CREATE COMPLETE POLICY SET
-- All tables now have complete CRUD coverage (SELECT, INSERT, UPDATE, DELETE)
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- Table: users
-- Policies: Users can manage their own profile, admins can manage all users
-- -------------------------------------------------------------------------------------

CREATE POLICY "users_select" ON public.users
  FOR SELECT 
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "users_insert" ON public.users
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update" ON public.users
  FOR UPDATE 
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "users_delete" ON public.users
  FOR DELETE 
  USING (is_admin());

-- -------------------------------------------------------------------------------------
-- Table: team_members
-- Policies: Users can manage their own team members, admins can manage all
-- -------------------------------------------------------------------------------------

CREATE POLICY "team_members_select" ON public.team_members
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "team_members_insert" ON public.team_members
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "team_members_update" ON public.team_members
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "team_members_delete" ON public.team_members
  FOR DELETE 
  USING (auth.uid() = user_id OR is_admin());

-- -------------------------------------------------------------------------------------
-- Table: chat_conversations
-- Policies: Users can manage their own conversations, admins can manage all
-- -------------------------------------------------------------------------------------

CREATE POLICY "chat_conversations_select" ON public.chat_conversations
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "chat_conversations_insert" ON public.chat_conversations
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "chat_conversations_update" ON public.chat_conversations
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "chat_conversations_delete" ON public.chat_conversations
  FOR DELETE 
  USING (auth.uid() = user_id OR is_admin());

-- -------------------------------------------------------------------------------------
-- Table: chat_messages
-- Policies: Users can manage messages in their own conversations, admins can manage all
-- -------------------------------------------------------------------------------------

CREATE POLICY "chat_messages_select" ON public.chat_messages
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "chat_messages_insert" ON public.chat_messages
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "chat_messages_update" ON public.chat_messages
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "chat_messages_delete" ON public.chat_messages
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE id = chat_messages.conversation_id
      AND user_id = auth.uid()
    ) OR is_admin()
  );

-- -------------------------------------------------------------------------------------
-- Table: email_preferences
-- Policies: Users can manage their own preferences, admins can manage all
-- -------------------------------------------------------------------------------------

CREATE POLICY "email_preferences_select" ON public.email_preferences
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_preferences_insert" ON public.email_preferences
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_preferences_update" ON public.email_preferences
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_preferences_delete" ON public.email_preferences
  FOR DELETE 
  USING (auth.uid() = user_id OR is_admin());

-- -------------------------------------------------------------------------------------
-- Table: email_subscriptions
-- Policies: Users can view/manage their own, system can insert, admins can manage all
-- -------------------------------------------------------------------------------------

CREATE POLICY "email_subscriptions_select" ON public.email_subscriptions
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_subscriptions_insert" ON public.email_subscriptions
  FOR INSERT 
  WITH CHECK (true); -- System can insert subscriptions

CREATE POLICY "email_subscriptions_update" ON public.email_subscriptions
  FOR UPDATE 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_subscriptions_delete" ON public.email_subscriptions
  FOR DELETE 
  USING (auth.uid() = user_id OR is_admin());

-- -------------------------------------------------------------------------------------
-- Table: email_logs
-- Policies: Users can view their own logs, system can insert, only admins can modify
-- -------------------------------------------------------------------------------------

CREATE POLICY "email_logs_select" ON public.email_logs
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "email_logs_insert" ON public.email_logs
  FOR INSERT 
  WITH CHECK (true); -- System can insert email logs

CREATE POLICY "email_logs_update" ON public.email_logs
  FOR UPDATE 
  USING (is_admin());

CREATE POLICY "email_logs_delete" ON public.email_logs
  FOR DELETE 
  USING (is_admin());

-- -------------------------------------------------------------------------------------
-- Table: unsubscribe_tokens
-- Policies: Users can view/delete their own tokens, system can insert/update
-- -------------------------------------------------------------------------------------

CREATE POLICY "unsubscribe_tokens_select" ON public.unsubscribe_tokens
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "unsubscribe_tokens_insert" ON public.unsubscribe_tokens
  FOR INSERT 
  WITH CHECK (true); -- System can insert tokens

CREATE POLICY "unsubscribe_tokens_update" ON public.unsubscribe_tokens
  FOR UPDATE 
  USING (true); -- System can update tokens (e.g., mark as used)

CREATE POLICY "unsubscribe_tokens_delete" ON public.unsubscribe_tokens
  FOR DELETE 
  USING (auth.uid() = user_id OR is_admin());

-- -------------------------------------------------------------------------------------
-- Table: ai_usage_logs
-- Policies: Users can view their own logs, system can insert, only admins can modify
-- -------------------------------------------------------------------------------------

CREATE POLICY "ai_usage_logs_select" ON public.ai_usage_logs
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "ai_usage_logs_insert" ON public.ai_usage_logs
  FOR INSERT 
  WITH CHECK (true); -- System can insert AI usage logs

CREATE POLICY "ai_usage_logs_update" ON public.ai_usage_logs
  FOR UPDATE 
  USING (is_admin());

CREATE POLICY "ai_usage_logs_delete" ON public.ai_usage_logs
  FOR DELETE 
  USING (is_admin());

-- -------------------------------------------------------------------------------------
-- Table: analytics_events
-- Policies: Users can view/insert their own events, only admins can modify/delete
-- -------------------------------------------------------------------------------------

CREATE POLICY "analytics_events_select" ON public.analytics_events
  FOR SELECT 
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "analytics_events_insert" ON public.analytics_events
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR is_admin());

CREATE POLICY "analytics_events_update" ON public.analytics_events
  FOR UPDATE 
  USING (is_admin());

CREATE POLICY "analytics_events_delete" ON public.analytics_events
  FOR DELETE 
  USING (is_admin());

-- -------------------------------------------------------------------------------------
-- Table: strengths
-- Policies: All authenticated users can view, only admins can modify
-- -------------------------------------------------------------------------------------

CREATE POLICY "strengths_select" ON public.strengths
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "strengths_insert" ON public.strengths
  FOR INSERT 
  WITH CHECK (is_admin());

CREATE POLICY "strengths_update" ON public.strengths
  FOR UPDATE 
  USING (is_admin());

CREATE POLICY "strengths_delete" ON public.strengths
  FOR DELETE 
  USING (is_admin());

-- =====================================================================================
-- MIGRATION COMPLETE
-- 
-- Summary of changes:
-- ✓ Synced existing role data from public.users to auth.users metadata
-- ✓ Dropped all existing RLS policies (clean slate)
-- ✓ Created non-recursive is_admin() function using auth.users metadata
-- ✓ Created role sync trigger to keep public.users and auth.users in sync
-- ✓ Created complete CRUD policy sets for all 11 tables
-- ✓ Added comprehensive comments and documentation
--
-- Next steps:
-- 1. Test the migration in a development environment
-- 2. Verify admin access works correctly
-- 3. Verify regular user access is properly restricted
-- 4. Apply to production after successful testing
-- =====================================================================================