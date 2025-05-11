import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './environment';

// Initialize Supabase client with environment variables
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;

// Log connection details (excluding sensitive keys)
console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);

// Create a single supabase client for the entire app
export const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
supabase.auth.getSession().then(({ data }) => {
  if (data.session) {
    console.log("Supabase connection successful - authenticated session exists");
  } else {
    console.log("Supabase connection successful - no authenticated session");
  }
}).catch(err => {
  console.error("Supabase connection error:", err.message);
});

/**
 * Save a stress assessment to the database
 */
export async function saveStressAssessment(data: any) {
  try {
    console.log("Starting to save stress assessment to Supabase...");
    
    // Format the data for Supabase
    const { userId, score, symptoms, triggers, notes, responses } = data;
    
    // Validate required fields
    if (!userId) {
      throw new Error("User ID is required for saving assessment");
    }
    
    // Ensure score is a valid number
    const parsedScore = parseFloat(score.toString());
    if (isNaN(parsedScore)) {
      throw new Error("Invalid score value");
    }
    
    // Prepare assessment data with proper formatting
    const assessmentData = {
      user_id: userId,
      score: parsedScore,
      symptoms: Array.isArray(symptoms) ? symptoms : [],
      triggers: Array.isArray(triggers) ? triggers : [],
      notes: notes || '',
      responses: responses,
      created_at: new Date().toISOString()
    };
    
    console.log("Formatted assessment data:", JSON.stringify(assessmentData, null, 2));
    
    // First verify connection to Supabase is working
    try {
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error("Failed to verify Supabase connection");
      }
      console.log("Supabase connection verified:", authData.session ? "Authenticated" : "Not authenticated");
    } catch (connError) {
      console.error("Connection test failed:", connError);
      throw new Error("Failed to connect to Supabase");
    }
    
    // Save the assessment to Supabase
    console.log("Inserting assessment into stress_assessments table...");
    const { data: savedAssessment, error } = await supabase
      .from('stress_assessments')
      .insert(assessmentData)
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting assessment:", error.message, error.details);
      
      // If table doesn't exist, create it (this shouldn't happen in production)
      if (error.message.includes("does not exist")) {
        console.log("Table doesn't exist, assessment saved locally");
        return null; // This will trigger local storage fallback
      }
      throw error;
    }
    
    console.log("Assessment inserted successfully:", savedAssessment);
    
    // Now update or create metrics
    console.log("Checking for existing metrics...");
    const { data: existingMetrics, error: metricsError } = await supabase
      .from('user_assessment_metrics')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    // Handle metrics error without breaking the whole process
    if (metricsError) {
      if (!metricsError.message.includes("No rows found")) {
        console.error("Error checking metrics:", metricsError.message);
      } else {
        console.log("No existing metrics found, will create new");
      }
    }
    
    const now = new Date().toISOString();
    
    try {
      if (existingMetrics) {
        // Update existing metrics
        console.log("Updating existing metrics...");
        const { error: updateError } = await supabase
          .from('user_assessment_metrics')
          .update({
            stress_level: parsedScore,
            last_assessment_at: now,
            updated_at: now
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error('Error updating metrics:', updateError.message);
        } else {
          console.log("Metrics updated successfully");
        }
      } else {
        // Create new metrics
        console.log("Creating new metrics...");
        const { error: createError } = await supabase
          .from('user_assessment_metrics')
          .insert({
            user_id: userId,
            stress_level: parsedScore,
            last_assessment_at: now,
            streak_count: 1,
            consistency_score: 0,
            trend: 'stable',
            first_check_in_date: now,
            updated_at: now
          });
        
        if (createError) {
          console.error('Error creating metrics:', createError.message);
        } else {
          console.log("New metrics created successfully");
        }
      }
    } catch (metricsOperationError) {
      // Don't let metrics error break the whole process
      console.error("Error with metrics operation:", metricsOperationError);
    }
    
    console.log("Stress assessment process completed successfully");
    return savedAssessment;
  } catch (error: any) {
    console.error('Error saving assessment to Supabase:', error.message, error.stack);
    throw new Error(error.message || "Failed to save assessment to database");
  }
}

/**
 * Get stress assessments for a user
 */
export async function getStressAssessments(userId: string, limit?: number) {
  try {
    let query = supabase
      .from('stress_assessments')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (limit) {
      query = query.limit(limit);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching assessments from Supabase:', error);
    throw error;
  }
}

/**
 * Save a mood entry to the database
 */
export async function saveMoodEntry(data: any) {
  try {
    console.log("Starting to save mood entry to Supabase...");
    
    // Format the data for Supabase
    const { user_id, mood_score, assessment_result, notes } = data;
    
    // Validate required fields
    if (!user_id) {
      throw new Error("User ID is required for saving mood entry");
    }
    
    const parsedScore = parseFloat(mood_score.toString());
    if (isNaN(parsedScore)) {
      throw new Error("Invalid mood score value");
    }
    
    // Prepare entry data for database
    const entryData = {
      user_id,
      mood_score: parsedScore,
      assessment_result: assessment_result || '',
      notes: notes || '',
      created_at: new Date().toISOString()
    };
    
    console.log("Formatted mood entry data:", JSON.stringify(entryData, null, 2));
    
    // Save the mood entry to Supabase
    console.log("Inserting mood entry into mood_entries table...");
    const { data: savedEntry, error } = await supabase
      .from('mood_entries')
      .insert(entryData)
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting mood entry:", error.message, error.details);
      throw error;
    }
    
    console.log("Mood entry inserted successfully:", savedEntry);
    return savedEntry;
  } catch (error: any) {
    console.error('Error saving mood entry to Supabase:', error.message, error.stack);
    throw new Error(error.message || "Failed to save mood entry to database");
  }
}

export default {
  supabase,
  saveStressAssessment,
  getStressAssessments,
  saveMoodEntry
}; 