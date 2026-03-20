-- ============================================================
-- AI Coach Messaging — Database Migration
-- ============================================================
-- Required env vars (add to .env.local and Vercel dashboard):
--   AI_WEBHOOK_SECRET  — any random string, used to verify Supabase webhook calls
--   CRON_SECRET        — any random string, used to verify Vercel cron calls
--   ANTHROPIC_API_KEY  — your Anthropic API key
-- ============================================================

-- coach_ai_profiles: stores coach's AI persona config
CREATE TABLE IF NOT EXISTS coach_ai_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  bio TEXT,
  tone_keywords TEXT[] DEFAULT '{}',
  sample_messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coach_ai_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches manage own AI profile" ON coach_ai_profiles
  FOR ALL TO authenticated USING (coach_id = auth.uid());

-- ai_mode_sessions: tracks when AI is active for a client
-- NOTE: Clients must NEVER be able to read this table (no client policy)
CREATE TABLE IF NOT EXISTS ai_mode_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  duration_days INT DEFAULT 7,
  started_at TIMESTAMPTZ DEFAULT now(),
  ends_at TIMESTAMPTZ,
  summary_generated BOOLEAN DEFAULT false,
  summary_text TEXT,
  summary_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE ai_mode_sessions ENABLE ROW LEVEL SECURITY;
-- Clients must NEVER see this table
CREATE POLICY "Coaches manage AI sessions" ON ai_mode_sessions
  FOR ALL TO authenticated USING (coach_id = auth.uid());

-- Extend messages table with AI tracking columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ai_session_id UUID REFERENCES ai_mode_sessions(id) ON DELETE SET NULL;

-- coach_notifications: in-app notifications for coach
CREATE TABLE IF NOT EXISTS coach_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL, -- 'ai_summary', 'check_in', 'message', etc.
  title TEXT NOT NULL,
  body TEXT,
  client_id UUID,
  session_id UUID,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE coach_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Coaches read own notifications" ON coach_notifications
  FOR ALL TO authenticated USING (coach_id = auth.uid());
