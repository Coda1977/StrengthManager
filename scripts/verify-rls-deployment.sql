-- Verification script for RLS policy deployment
-- Run this to verify the comprehensive RLS fix was applied successfully

-- 1. Check policy count per table (should be 44 total)
SELECT 
  schemaname, 
  tablename, 
  COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY schemaname, tablename 
ORDER BY tablename;

-- 2. Check total policy count
SELECT COUNT(*) as total_policies 
FROM pg_policies 
WHERE schemaname = 'public';

-- 3. Verify is_admin() function exists and is non-recursive
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'is_admin';

-- 4. Verify role sync trigger exists
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name,
  tgenabled as enabled
FROM pg_trigger
WHERE tgname = 'sync_role_to_auth_trigger';

-- 5. Check if roles are synced in auth.users metadata
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role_in_metadata
FROM auth.users
LIMIT 5;

-- 6. List all policies by table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;