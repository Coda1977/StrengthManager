-- Verify all RLS policies across all tables, focusing on admin policies

-- Users table policies
SELECT 
  'users' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;

-- Team members table policies
SELECT 
  'team_members' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'team_members' 
ORDER BY policyname;

-- Chat conversations table policies
SELECT 
  'chat_conversations' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'chat_conversations' 
ORDER BY policyname;

-- Chat messages table policies
SELECT 
  'chat_messages' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'chat_messages' 
ORDER BY policyname;

-- Email preferences table policies
SELECT 
  'email_preferences' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'email_preferences' 
ORDER BY policyname;

-- Email subscriptions table policies
SELECT 
  'email_subscriptions' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'email_subscriptions' 
ORDER BY policyname;

-- Email logs table policies
SELECT 
  'email_logs' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'email_logs' 
ORDER BY policyname;

-- Unsubscribe tokens table policies
SELECT 
  'unsubscribe_tokens' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'unsubscribe_tokens' 
ORDER BY policyname;

-- AI usage logs table policies
SELECT 
  'ai_usage_logs' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'ai_usage_logs' 
ORDER BY policyname;

-- Analytics events table policies
SELECT 
  'analytics_events' as table_name,
  policyname,
  cmd,
  CASE 
    WHEN qual IS NOT NULL THEN substring(qual, 1, 100)
    ELSE NULL
  END as using_expression_preview
FROM pg_policies 
WHERE tablename = 'analytics_events' 
ORDER BY policyname;