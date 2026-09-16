-- ============================================================
-- STUDENT AUTOMATION SYSTEM — SUPABASE DATABASE SCHEMA
-- ============================================================

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  dob DATE,
  age INTEGER,
  gender TEXT,
  languages TEXT[],
  institution TEXT,
  department TEXT,
  roll_number TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  account_status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Face Biometric Credentials & ML Database Images Table
CREATE TABLE IF NOT EXISTS public.face_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  -- Encrypted 128-dimensional embedding vectors (AES-256)
  embedding_front TEXT NOT NULL,
  embedding_bottom TEXT NOT NULL,
  embedding_left TEXT NOT NULL,
  embedding_right TEXT NOT NULL,
  -- ML Database Image storage: stores the 4 angle raw/base64 frames for further face recognition ML training
  image_front_url TEXT,
  image_bottom_url TEXT,
  image_left_url TEXT,
  image_right_url TEXT,
  model_version TEXT DEFAULT 'face-api-tiny-v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ
);

-- 3. OTP Verification Codes Table
CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  purpose TEXT NOT NULL, -- 'registration', 'login', 'reset'
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  consumed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Login Sessions Table
CREATE TABLE IF NOT EXISTS public.login_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  device_info TEXT,
  ip_address TEXT,
  login_at TIMESTAMPTZ DEFAULT NOW(),
  logout_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- 5. Login History Table
CREATE TABLE IF NOT EXISTS public.login_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'success', 'failed_password', 'failed_face', 'failed_otp'
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Activity Monitor Logs Table
CREATE TABLE IF NOT EXISTS public.activity_monitor_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  session_id UUID,
  state TEXT NOT NULL, -- 'active', 'idle', 'drowsy'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- ── Create Indexes ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_face_credentials_user_id ON public.face_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email_purpose ON public.otp_codes(email, purpose);
CREATE INDEX IF NOT EXISTS idx_login_sessions_token ON public.login_sessions(token);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_monitor_logs(user_id);

-- ── Enable Row Level Security (RLS) with Public Anon Policies ──
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_monitor_logs ENABLE ROW LEVEL SECURITY;

-- Allow anon key full operations for client application API
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access users') THEN
    CREATE POLICY "Allow public access users" ON public.users FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access face') THEN
    CREATE POLICY "Allow public access face" ON public.face_credentials FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access otp') THEN
    CREATE POLICY "Allow public access otp" ON public.otp_codes FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access sessions') THEN
    CREATE POLICY "Allow public access sessions" ON public.login_sessions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access history') THEN
    CREATE POLICY "Allow public access history" ON public.login_history FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow public access monitor') THEN
    CREATE POLICY "Allow public access monitor" ON public.activity_monitor_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
