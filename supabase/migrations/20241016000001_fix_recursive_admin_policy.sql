-- Migration to fix recursive RLS policies using security definer function
-- The previous migration (20241016000000) created recursive policies that prevent admin access

-- ============================================================================
-- CREATE NON-RECURSIVE ADMIN CHECK FUNCTION
-- ============================================================================

-- This function bypasses RLS by using SECURITY DEFINER
-- It allows checking admin status without triggering recursive policy checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- ============================================================================
-- FIX USERS TABLE - Remove recursive policy and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (is_admin());

-- ============================================================================
-- FIX TEAM_MEMBERS TABLE - Remove recursive policy and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all team members" ON public.team_members;

CREATE POLICY "Admins can view all team members" ON public.team_members
  FOR SELECT USING (is_admin());

-- ============================================================================
-- FIX CHAT_CONVERSATIONS TABLE - Remove recursive policy and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all conversations" ON public.chat_conversations;

CREATE POLICY "Admins can view all conversations" ON public.chat_conversations
  FOR SELECT USING (is_admin());

-- ============================================================================
-- FIX CHAT_MESSAGES TABLE - Remove recursive policy and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all messages" ON public.chat_messages;

CREATE POLICY "Admins can view all messages" ON public.chat_messages
  FOR SELECT USING (is_admin());

-- ============================================================================
-- FIX EMAIL_PREFERENCES TABLE - Remove recursive policies and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all email preferences" ON public.email_preferences;

CREATE POLICY "Admins can view all email preferences" ON public.email_preferences
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admins can update all email preferences" ON public.email_preferences;

CREATE POLICY "Admins can update all email preferences" ON public.email_preferences
  FOR UPDATE USING (is_admin());

-- ============================================================================
-- FIX UNSUBSCRIBE_TOKENS TABLE - Remove recursive policy and use function
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all unsubscribe tokens" ON public.unsubscribe_tokens;

CREATE POLICY "Admins can view all unsubscribe tokens" ON public.unsubscribe_tokens
  FOR SELECT USING (is_admin());

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Add comment to document the fix
COMMENT ON FUNCTION public.is_admin() IS 
  'Non-recursive admin check function using SECURITY DEFINER to bypass RLS. '
  'This prevents infinite recursion when admin policies check the users table.';