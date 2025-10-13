-- Create AI usage tracking table
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type TEXT NOT NULL CHECK (request_type IN ('chat', 'email_content', 'insights', 'title_generation', 'synergy_tips')),
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  estimated_cost DECIMAL(10, 6) NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_ai_usage_logs_created_at ON public.ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_request_type ON public.ai_usage_logs(request_type);
CREATE INDEX idx_ai_usage_logs_user_id ON public.ai_usage_logs(user_id);

-- Enable Row Level Security
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all AI usage logs
CREATE POLICY "Admins can view all AI usage logs" ON public.ai_usage_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policy: System can insert AI usage logs (no auth required for logging)
CREATE POLICY "System can insert AI usage logs" ON public.ai_usage_logs
  FOR INSERT WITH CHECK (true);