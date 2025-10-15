-- Add missing index for ai_usage_logs.conversation_id foreign key
-- This improves JOIN performance and CASCADE delete operations

CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_conversation_id 
ON public.ai_usage_logs(conversation_id);