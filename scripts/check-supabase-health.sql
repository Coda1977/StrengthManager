-- Comprehensive Supabase Health Check
-- Run this in Supabase SQL Editor to check for any issues

-- ============================================================================
-- 1. CHECK RLS POLICY COUNT (Should be 44 total)
-- ============================================================================
SELECT 
  'Policy Count Check' as check_name,
  COUNT(*) as total_policies,
  CASE 
    WHEN COUNT(*) = 44 THEN '✅ PASS'
    ELSE '❌ FAIL - Expected 44 policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================================================
-- 2. CHECK POLICIES PER TABLE
-- ============================================================================
SELECT 
  'Policies Per Table' as check_name,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN tablename IN ('users', 'team_members', 'chat_conversations', 'chat_messages', 
                       'email_preferences', 'email_subscriptions', 'email_logs', 
                       'unsubscribe_tokens', 'ai_usage_logs', 'analytics_events') 
         AND COUNT(*) = 4 THEN '✅ Complete CRUD'
    WHEN tablename = 'strengths' AND COUNT(*) = 4 THEN '✅ Complete CRUD'
    ELSE '⚠️ Check policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 3. CHECK is_admin() FUNCTION
-- ============================================================================
SELECT 
  'is_admin() Function' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'is_admin'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- ============================================================================
-- 4. CHECK ROLE SYNC TRIGGER
-- ============================================================================
SELECT 
  'Role Sync Trigger' as check_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'sync_role_to_auth_trigger'
    ) THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- ============================================================================
-- 5. CHECK FOR MISSING DELETE POLICIES (Should be 0)
-- ============================================================================
SELECT 
  'Missing DELETE Policies' as check_name,
  COUNT(*) as tables_without_delete,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ All tables have DELETE policies'
    ELSE '❌ Some tables missing DELETE policies'
  END as status
FROM (
  SELECT DISTINCT tablename
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('users', 'team_members', 'chat_conversations', 'chat_messages',
                      'email_preferences', 'email_subscriptions', 'email_logs',
                      'unsubscribe_tokens', 'ai_usage_logs', 'analytics_events', 'strengths')
    AND tablename NOT IN (
      SELECT tablename 
      FROM pg_policies 
      WHERE schemaname = 'public' AND cmd = 'DELETE'
    )
) missing;

-- ============================================================================
-- 6. CHECK RLS IS ENABLED ON ALL TABLES
-- ============================================================================
SELECT 
  'RLS Enabled Check' as check_name,
  tablename,
  CASE 
    WHEN relrowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as status
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN ('users', 'team_members', 'chat_conversations', 'chat_messages',
                      'email_preferences', 'email_subscriptions', 'email_logs',
                      'unsubscribe_tokens', 'ai_usage_logs', 'analytics_events', 'strengths')
ORDER BY tablename;

-- ============================================================================
-- 7. CHECK FOR RECURSIVE POLICIES (Should be 0)
-- ============================================================================
SELECT
  'Recursive Policy Check' as check_name,
  COUNT(*) as potentially_recursive,
  CASE
    WHEN COUNT(*) = 0 THEN '✅ No recursive policies detected'
    ELSE '⚠️ Review these policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    -- Check if policy definition contains queries to the same table
    qual LIKE '%FROM ' || tablename || '%'
    OR with_check LIKE '%FROM ' || tablename || '%'
  );

-- ============================================================================
-- 8. LIST ALL CURRENT POLICIES
-- ============================================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍'
    WHEN cmd = 'INSERT' THEN '➕'
    WHEN cmd = 'UPDATE' THEN '✏️'
    WHEN cmd = 'DELETE' THEN '🗑️'
  END as icon
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- ============================================================================
-- 9. CHECK ROLE METADATA SYNC
-- ============================================================================
SELECT 
  'Role Metadata Sync' as check_name,
  COUNT(*) as users_with_role_metadata,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Roles synced to auth.users'
    ELSE '⚠️ No role metadata found'
  END as status
FROM auth.users
WHERE raw_user_meta_data->>'role' IS NOT NULL;

-- ============================================================================
-- 10. SUMMARY
-- ============================================================================
SELECT 
  '=== DEPLOYMENT SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies,
  CASE 
    WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') = 44 
    THEN '✅ DEPLOYMENT SUCCESSFUL'
    ELSE '⚠️ REVIEW NEEDED'
  END as overall_status;