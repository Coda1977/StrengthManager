-- Check RLS policies on users table
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;