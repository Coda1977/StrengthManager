-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  top_5_strengths TEXT[] NOT NULL,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  top_5_strengths TEXT[] NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create strengths reference table
CREATE TABLE IF NOT EXISTS public.strengths (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL CHECK (domain IN ('Executing', 'Influencing', 'Relationship Building', 'Strategic Thinking')),
  description TEXT NOT NULL,
  keywords TEXT[],
  detailed_info JSONB
);

-- Create chat_conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('my-strengths', 'team-strengths')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics_events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create email_preferences table
CREATE TABLE IF NOT EXISTS public.email_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
  paused BOOLEAN DEFAULT FALSE,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON public.analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id ON public.email_preferences(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_preferences_updated_at BEFORE UPDATE ON public.email_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strengths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for team_members table
CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for strengths table (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view strengths" ON public.strengths
  FOR SELECT USING (auth.role() = 'authenticated');

-- RLS Policies for chat_conversations table
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON public.chat_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON public.chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for chat_messages table
CREATE POLICY "Users can view own messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for analytics_events table
CREATE POLICY "Users can view own analytics" ON public.analytics_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analytics" ON public.analytics_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all analytics" ON public.analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for email_preferences table
CREATE POLICY "Users can view own email preferences" ON public.email_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" ON public.email_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" ON public.email_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert all 34 CliftonStrengths
INSERT INTO public.strengths (name, domain, description, keywords) VALUES
  ('Achiever', 'Executing', 'People exceptionally talented in the Achiever theme work hard and possess a great deal of stamina. They take immense satisfaction in being busy and productive.', ARRAY['productive', 'hardworking', 'stamina', 'busy']),
  ('Activator', 'Influencing', 'People exceptionally talented in the Activator theme can make things happen by turning thoughts into action. They want to do things now, rather than simply talk about them.', ARRAY['action', 'impatient', 'catalyst', 'decisive']),
  ('Adaptability', 'Relationship Building', 'People exceptionally talented in the Adaptability theme prefer to go with the flow. They tend to be "now" people who take things as they come and discover the future one day at a time.', ARRAY['flexible', 'present', 'spontaneous', 'responsive']),
  ('Analytical', 'Strategic Thinking', 'People exceptionally talented in the Analytical theme search for reasons and causes. They have the ability to think about all of the factors that might affect a situation.', ARRAY['logical', 'objective', 'data', 'proof']),
  ('Arranger', 'Executing', 'People exceptionally talented in the Arranger theme can organize, but they also have a flexibility that complements this ability. They like to determine how all of the pieces and resources can be arranged for maximum productivity.', ARRAY['organize', 'coordinate', 'flexible', 'productive']),
  ('Belief', 'Executing', 'People exceptionally talented in the Belief theme have certain core values that are unchanging. Out of these values emerges a defined purpose for their lives.', ARRAY['values', 'purpose', 'ethics', 'meaning']),
  ('Command', 'Influencing', 'People exceptionally talented in the Command theme have presence. They can take control of a situation and make decisions.', ARRAY['decisive', 'direct', 'confrontation', 'leadership']),
  ('Communication', 'Influencing', 'People exceptionally talented in the Communication theme generally find it easy to put their thoughts into words. They are good conversationalists and presenters.', ARRAY['articulate', 'storytelling', 'presenter', 'engaging']),
  ('Competition', 'Influencing', 'People exceptionally talented in the Competition theme measure their progress against the performance of others. They strive to win first place and revel in contests.', ARRAY['winning', 'comparison', 'contest', 'performance']),
  ('Connectedness', 'Relationship Building', 'People exceptionally talented in the Connectedness theme have faith in the links among all things. They believe there are few coincidences and that almost every event has meaning.', ARRAY['faith', 'meaning', 'purpose', 'spiritual']),
  ('Consistency', 'Executing', 'People exceptionally talented in the Consistency theme are keenly aware of the need to treat people the same. They crave stable routines and clear rules and procedures that everyone can follow.', ARRAY['fairness', 'equality', 'rules', 'balance']),
  ('Context', 'Strategic Thinking', 'People exceptionally talented in the Context theme enjoy thinking about the past. They understand the present by researching its history.', ARRAY['history', 'past', 'perspective', 'understanding']),
  ('Deliberative', 'Executing', 'People exceptionally talented in the Deliberative theme are best described by the serious care they take in making decisions or choices. They anticipate obstacles.', ARRAY['careful', 'vigilant', 'risk', 'private']),
  ('Developer', 'Relationship Building', 'People exceptionally talented in the Developer theme recognize and cultivate the potential in others. They spot the signs of each small improvement and derive satisfaction from evidence of progress.', ARRAY['growth', 'potential', 'improvement', 'encouragement']),
  ('Discipline', 'Executing', 'People exceptionally talented in the Discipline theme enjoy routine and structure. Their world is best described by the order they create.', ARRAY['organized', 'structured', 'routine', 'predictable']),
  ('Empathy', 'Relationship Building', 'People exceptionally talented in the Empathy theme can sense other peoples feelings by imagining themselves in others lives or situations.', ARRAY['feelings', 'understanding', 'compassion', 'intuitive']),
  ('Focus', 'Executing', 'People exceptionally talented in the Focus theme can take a direction, follow through and make the corrections necessary to stay on track. They prioritize, then act.', ARRAY['goals', 'priorities', 'direction', 'efficiency']),
  ('Futuristic', 'Strategic Thinking', 'People exceptionally talented in the Futuristic theme are inspired by the future and what could be. They energize others with their visions of the future.', ARRAY['vision', 'future', 'inspiration', 'possibilities']),
  ('Harmony', 'Relationship Building', 'People exceptionally talented in the Harmony theme look for consensus. They dont enjoy conflict; rather, they seek areas of agreement.', ARRAY['consensus', 'agreement', 'peace', 'practical']),
  ('Ideation', 'Strategic Thinking', 'People exceptionally talented in the Ideation theme are fascinated by ideas. They are able to find connections between seemingly disparate phenomena.', ARRAY['creative', 'innovative', 'connections', 'ideas']),
  ('Includer', 'Relationship Building', 'People exceptionally talented in the Includer theme accept others. They show awareness of those who feel left out and make an effort to include them.', ARRAY['acceptance', 'inclusion', 'welcoming', 'tolerance']),
  ('Individualization', 'Relationship Building', 'People exceptionally talented in the Individualization theme are intrigued with the unique qualities of each person. They have a gift for figuring out how different people can work together productively.', ARRAY['unique', 'differences', 'personalized', 'observant']),
  ('Input', 'Strategic Thinking', 'People exceptionally talented in the Input theme have a need to collect and archive. They may accumulate information, ideas, artifacts or even relationships.', ARRAY['curious', 'collector', 'information', 'resourceful']),
  ('Intellection', 'Strategic Thinking', 'People exceptionally talented in the Intellection theme are characterized by their intellectual activity. They are introspective and appreciate intellectual discussions.', ARRAY['thinking', 'introspective', 'philosophical', 'contemplative']),
  ('Learner', 'Strategic Thinking', 'People exceptionally talented in the Learner theme have a great desire to learn and want to continuously improve. The process of learning, rather than the outcome, excites them.', ARRAY['learning', 'growth', 'improvement', 'curious']),
  ('Maximizer', 'Influencing', 'People exceptionally talented in the Maximizer theme focus on strengths as a way to stimulate personal and group excellence. They seek to transform something strong into something superb.', ARRAY['excellence', 'strengths', 'quality', 'potential']),
  ('Positivity', 'Relationship Building', 'People exceptionally talented in the Positivity theme have contagious enthusiasm. They are upbeat and can get others excited about what they are going to do.', ARRAY['enthusiasm', 'optimistic', 'upbeat', 'energy']),
  ('Relator', 'Relationship Building', 'People exceptionally talented in the Relator theme enjoy close relationships with others. They find deep satisfaction in working hard with friends to achieve a goal.', ARRAY['relationships', 'trust', 'genuine', 'depth']),
  ('Responsibility', 'Executing', 'People exceptionally talented in the Responsibility theme take psychological ownership of what they say they will do. They are committed to stable values such as honesty and loyalty.', ARRAY['commitment', 'ownership', 'dependable', 'ethical']),
  ('Restorative', 'Executing', 'People exceptionally talented in the Restorative theme are adept at dealing with problems. They are good at figuring out what is wrong and resolving it.', ARRAY['problem-solving', 'fixing', 'solutions', 'troubleshooting']),
  ('Self-Assurance', 'Influencing', 'People exceptionally talented in the Self-Assurance theme feel confident in their ability to take risks and manage their own lives. They have an inner compass that gives them certainty in their decisions.', ARRAY['confident', 'independent', 'risk', 'certainty']),
  ('Significance', 'Influencing', 'People exceptionally talented in the Significance theme want to make a big impact. They are independent and prioritize projects based on how much influence they will have on their organization or people around them.', ARRAY['impact', 'recognition', 'important', 'influence']),
  ('Strategic', 'Strategic Thinking', 'People exceptionally talented in the Strategic theme create alternative ways to proceed. Faced with any given scenario, they can quickly spot the relevant patterns and issues.', ARRAY['patterns', 'alternatives', 'anticipate', 'planning']),
  ('Woo', 'Influencing', 'People exceptionally talented in the Woo theme love the challenge of meeting new people and winning them over. They derive satisfaction from breaking the ice and making a connection with someone.', ARRAY['networking', 'social', 'charming', 'connections'])
ON CONFLICT (name) DO NOTHING;