-- Database setup for Emotions App

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create emotions table
CREATE TABLE IF NOT EXISTS public.emotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  emotion_type TEXT NOT NULL,
  intensity INTEGER CHECK (intensity >= 1 AND intensity <= 10),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create emotion_logs table
CREATE TABLE IF NOT EXISTS public.emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.user_profiles(id),
  emotion_id UUID REFERENCES public.emotions(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  context TEXT,
  triggers TEXT[]
);

-- Insert test user
INSERT INTO public.user_profiles (full_name, email, created_at, updated_at)
VALUES ('Test User', 'test@example.com', now(), now())
ON CONFLICT DO NOTHING; 