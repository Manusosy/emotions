import { supabase } from '@/lib/supabase';
import { devLog, errorLog } from '@/utils/environment';

/**
 * Utility function to check and create required database tables
 */
export async function setupDatabase() {
  try {
    devLog("Checking and setting up database tables...");
    
    // First check if we can connect to Supabase
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      errorLog("Authentication error during database setup:", authError);
      return {
        success: false,
        message: "Failed to authenticate with Supabase",
        error: authError.message
      };
    }
    
    devLog("Supabase authentication status:", authData.session ? "Authenticated" : "Not authenticated");
    
    // Call the API route for table creation
    try {
      const response = await fetch('/api/create-tables');
      if (!response.ok) {
        throw new Error(`API returned error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      devLog("Database setup result:", data);
      
      // Check if any tables failed to be created or verified
      const allTablesCreated = data.results && 
        data.results.stress_assessments && 
        data.results.user_assessment_metrics && 
        data.results.mood_entries;
      
      if (!allTablesCreated) {
        devLog("Some tables are not available, attempting direct SQL setup");
        await runDirectDatabaseSetup();
      }
      
      return data;
    } catch (apiError) {
      errorLog("Error using API for database setup:", apiError);
      devLog("Falling back to direct SQL setup");
      
      // If the API route fails, try direct SQL setup
      return await runDirectDatabaseSetup();
    }
  } catch (error) {
    errorLog("Error setting up database:", error);
    return {
      success: false,
      message: "Failed to set up database",
      error: String(error)
    };
  }
}

/**
 * Fallback function to directly create tables without using the API
 */
async function runDirectDatabaseSetup() {
  try {
    devLog("Starting direct database setup...");
    const results = {
      stress_assessments: false,
      user_assessment_metrics: false,
      mood_entries: false
    };
    
    // Check and create stress_assessments table
    try {
      const stressTableExists = await tableExists('stress_assessments');
      if (!stressTableExists) {
        devLog("Creating stress_assessments table...");
        const { error } = await supabase.rpc('create_stress_assessments_table');
        if (error) {
          errorLog("Error creating stress_assessments table:", error);
        } else {
          results.stress_assessments = true;
        }
      } else {
        devLog("stress_assessments table already exists");
        results.stress_assessments = true;
      }
    } catch (error) {
      errorLog("Error checking/creating stress_assessments table:", error);
    }
    
    // Check and create user_assessment_metrics table
    try {
      const metricsTableExists = await tableExists('user_assessment_metrics');
      if (!metricsTableExists) {
        devLog("Creating user_assessment_metrics table...");
        const { error } = await supabase.rpc('create_metrics_table');
        if (error) {
          errorLog("Error creating user_assessment_metrics table:", error);
        } else {
          results.user_assessment_metrics = true;
        }
      } else {
        devLog("user_assessment_metrics table already exists");
        results.user_assessment_metrics = true;
      }
    } catch (error) {
      errorLog("Error checking/creating user_assessment_metrics table:", error);
    }
    
    // Check and create mood_entries table
    try {
      const moodTableExists = await tableExists('mood_entries');
      if (!moodTableExists) {
        devLog("Creating mood_entries table...");
        const { error } = await supabase.rpc('create_mood_entries_table');
        if (error) {
          errorLog("Error creating mood_entries table:", error);
        } else {
          results.mood_entries = true;
        }
      } else {
        devLog("mood_entries table already exists");
        results.mood_entries = true;
      }
    } catch (error) {
      errorLog("Error checking/creating mood_entries table:", error);
    }
    
    return {
      success: true,
      message: 'Direct database setup complete',
      results
    };
  } catch (error) {
    errorLog("Error in direct database setup:", error);
    return {
      success: false,
      message: "Failed direct database setup",
      error: String(error)
    };
  }
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    // Select a single row with limit 1 to test table existence
    const { error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true })
      .limit(1);
    
    // If there's no error, the table exists
    return !error;
  } catch (error) {
    errorLog(`Error checking if ${tableName} exists:`, error);
    return false;
  }
} 