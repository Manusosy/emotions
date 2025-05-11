-- Function to create stress_assessments table
CREATE OR REPLACE FUNCTION create_stress_assessments_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS stress_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    score DECIMAL(4, 1) NOT NULL,
    symptoms TEXT[] DEFAULT '{}',
    triggers TEXT[] DEFAULT '{}',
    notes TEXT DEFAULT '',
    responses JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add comments
  COMMENT ON TABLE stress_assessments IS 'Stores user stress assessment data';
  COMMENT ON COLUMN stress_assessments.score IS 'Stress score on a scale of 0-10';
  COMMENT ON COLUMN stress_assessments.symptoms IS 'Array of reported symptoms';
  COMMENT ON COLUMN stress_assessments.triggers IS 'Array of reported stress triggers';
  COMMENT ON COLUMN stress_assessments.responses IS 'Detailed JSON responses to assessment questions';
END;
$$ LANGUAGE plpgsql;

-- Function to create user_assessment_metrics table
CREATE OR REPLACE FUNCTION create_metrics_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_assessment_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE,
    stress_level DECIMAL(4, 1) DEFAULT 0,
    last_assessment_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    streak_count INTEGER DEFAULT 0,
    consistency_score INTEGER DEFAULT 0,
    trend TEXT DEFAULT 'stable',
    first_check_in_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add comments
  COMMENT ON TABLE user_assessment_metrics IS 'Stores user assessment metrics and statistics';
  COMMENT ON COLUMN user_assessment_metrics.stress_level IS 'Current stress level on a scale of 0-10';
  COMMENT ON COLUMN user_assessment_metrics.streak_count IS 'Number of consecutive days with assessments';
  COMMENT ON COLUMN user_assessment_metrics.trend IS 'Trend direction of stress levels (improving, declining, stable)';
END;
$$ LANGUAGE plpgsql;

-- Function to create mood_entries table
CREATE OR REPLACE FUNCTION create_mood_entries_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS mood_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    mood_score DECIMAL(4, 1) NOT NULL,
    assessment_result TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add comments
  COMMENT ON TABLE mood_entries IS 'Stores user mood tracking entries';
  COMMENT ON COLUMN mood_entries.mood_score IS 'Mood score on a scale of 1-10';
  COMMENT ON COLUMN mood_entries.assessment_result IS 'Text description of the mood assessment result';
END;
$$ LANGUAGE plpgsql; 