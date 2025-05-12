-- Ensure the UUID extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create stress_assessments table
CREATE TABLE IF NOT EXISTS stress_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  score DECIMAL(4, 1) NOT NULL CHECK (score >= 0 AND score <= 10),
  symptoms TEXT[] DEFAULT '{}',
  triggers TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  responses JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments for better documentation
COMMENT ON TABLE stress_assessments IS 'Stores user stress assessment data';
COMMENT ON COLUMN stress_assessments.score IS 'Stress score on a scale of 0-10';
COMMENT ON COLUMN stress_assessments.symptoms IS 'Array of reported symptoms';
COMMENT ON COLUMN stress_assessments.triggers IS 'Array of reported stress triggers';
COMMENT ON COLUMN stress_assessments.responses IS 'Detailed JSON responses to assessment questions';

-- Create user_assessment_metrics table
CREATE TABLE IF NOT EXISTS user_assessment_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE,
  stress_level DECIMAL(4, 1) DEFAULT 0 CHECK (stress_level >= 0 AND stress_level <= 10),
  last_assessment_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  streak_count INTEGER DEFAULT 0,
  consistency_score INTEGER DEFAULT 0 CHECK (consistency_score >= 0 AND consistency_score <= 100),
  trend TEXT DEFAULT 'stable',
  first_check_in_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE user_assessment_metrics IS 'Stores user assessment metrics and statistics';
COMMENT ON COLUMN user_assessment_metrics.stress_level IS 'Current stress level on a scale of 0-10';
COMMENT ON COLUMN user_assessment_metrics.streak_count IS 'Number of consecutive days with assessments';
COMMENT ON COLUMN user_assessment_metrics.trend IS 'Trend direction of stress levels (improving, declining, stable)';

-- Create mood_entries table
CREATE TABLE IF NOT EXISTS mood_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  mood_score DECIMAL(4, 1) NOT NULL CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_description TEXT DEFAULT '',
  assessment_result TEXT DEFAULT '',
  factors TEXT[] DEFAULT '{}',
  notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add comments
COMMENT ON TABLE mood_entries IS 'Stores user mood tracking entries';
COMMENT ON COLUMN mood_entries.mood_score IS 'Mood score on a scale of 1-10';
COMMENT ON COLUMN mood_entries.mood_description IS 'Text description of the mood (Happy, Sad, etc)';
COMMENT ON COLUMN mood_entries.assessment_result IS 'Text description of the mood assessment result';
COMMENT ON COLUMN mood_entries.factors IS 'Array of factors affecting mood';

-- Create journal_entries table for the journaling feature
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  mood_id UUID REFERENCES mood_entries(id),
  tags TEXT[] DEFAULT '{}',
  private BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE journal_entries IS 'Stores user journal entries';
COMMENT ON COLUMN journal_entries.mood_id IS 'Optional reference to a mood entry';
COMMENT ON COLUMN journal_entries.tags IS 'Array of tags/categories for the journal entry';
COMMENT ON COLUMN journal_entries.private IS 'Whether the entry is private or can be shared';

-- Create functions for app to call to create tables if needed
CREATE OR REPLACE FUNCTION create_stress_assessments_table()
RETURNS VOID AS $$
BEGIN
  -- Table creation is handled above with IF NOT EXISTS
  -- This function exists for compatibility with the app's API calls
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_metrics_table()
RETURNS VOID AS $$
BEGIN
  -- Table creation is handled above with IF NOT EXISTS
  -- This function exists for compatibility with the app's API calls
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_mood_entries_table()
RETURNS VOID AS $$
BEGIN
  -- Table creation is handled above with IF NOT EXISTS
  -- This function exists for compatibility with the app's API calls
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION create_journal_entries_table()
RETURNS VOID AS $$
BEGIN
  -- Table creation is handled above with IF NOT EXISTS
  -- This function exists for compatibility with the app's API calls
END;
$$ LANGUAGE plpgsql;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stress_user_id ON stress_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_stress_created_at ON stress_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_mood_entries_created_at ON mood_entries(created_at);

CREATE INDEX IF NOT EXISTS idx_journal_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_created_at ON journal_entries(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE stress_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessment_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Create policies that only allow users to see their own data
CREATE POLICY stress_assessment_policy ON stress_assessments
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY mood_entries_policy ON mood_entries
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY metrics_policy ON user_assessment_metrics
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY journal_entries_policy ON journal_entries
  FOR ALL USING (auth.uid() = user_id); 