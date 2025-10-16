-- Detailed Policy Analysis
-- Shows exactly what policies exist and their status

-- 1. Count policies by table and operation
SELECT 
  tablename,
  cmd as operation,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, cmd
ORDER BY tablename, 
  CASE cmd 
    WHEN 'SELECT' THEN 1
    WHEN 'INSERT' THEN 2
    WHEN 'UPDATE' THEN 3
    WHEN 'DELETE' THEN 4
  END;

-- 2. Check for DELETE policies specifically
SELECT 
  tablename,
  policyname,
  '✅ DELETE policy exists' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND cmd = 'DELETE'
ORDER BY tablename;

-- 3. Verify users table has DELETE policy
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND cmd = 'DELETE'
    ) THEN '✅ Users table has DELETE policy - User deletion will work!'
    ELSE '❌ Users table missing DELETE policy'
  END as user_deletion_status;

-- 4. Check is_admin() function
SELECT 
  '✅ is_admin() function exists' as status,
  proname as function_name,
  prosecdef as is_security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'is_admin';

-- 5. Summary by table
SELECT 
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE cmd = 'INSERT') as insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'UPDATE') as update_policies,
  COUNT(*) FILTER (WHERE cmd = 'DELETE') as delete_policies,
  CASE 
    WHEN COUNT(*) FILTER (WHERE cmd = 'DELETE') > 0 THEN '✅ Has DELETE'
    ELSE '❌ Missing DELETE'
  END as delete_status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;