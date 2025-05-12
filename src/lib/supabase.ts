import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from './environment';

/**
 * Validate Supabase URL format
 * 
 * @param url The URL to validate
 * @returns A boolean indicating if the URL is valid
 */
function isValidSupabaseUrl(url: string): boolean {
  try {
    // Check if URL is properly formed
    const urlObj = new URL(url);
    // Supabase URLs should be HTTPS and have a valid host
    return urlObj.protocol === 'https:' && 
           urlObj.hostname.includes('.supabase.co');
  } catch (e) {
    console.error('Invalid Supabase URL format:', e);
    return false;
  }
}

/**
 * Validate Supabase key format
 * 
 * @param key The key to validate
 * @returns A boolean indicating if the key looks valid
 */
function isValidSupabaseKey(key: string): boolean {
  // Supabase keys are JWT tokens and should be reasonably long
  // and start with "ey" (the beginning of a JWT)
  return typeof key === 'string' && 
         key.length > 30 && 
         key.startsWith('ey');
}

// Initialize Supabase client with environment variables
const supabaseUrl = SUPABASE_URL;
const supabaseKey = SUPABASE_KEY;

// Validate configuration before initializing
if (!isValidSupabaseUrl(supabaseUrl)) {
  console.error(`WARNING: Supabase URL appears to be invalid: ${supabaseUrl}`);
  // Continue anyway, but log the warning
}

if (!isValidSupabaseKey(supabaseKey)) {
  console.error('WARNING: Supabase key appears to be invalid');
  // Continue anyway, but log the warning
}

// Log connection details (excluding sensitive keys)
console.log(`Initializing Supabase client with URL: ${supabaseUrl}`);

// Create a single supabase client for the entire app with improved error handling
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  // Add more resilient fetch configuration
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'X-Client-Info': 'supabase-js/2.x',
    },
    fetch: (url, options) => {
      // Debug request
      console.log(`Supabase request to: ${typeof url === 'string' ? url.split('?')[0] : 'fetch request'}`);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('Supabase request timed out after 15 seconds');
      }, 15000);
      
      // Merge the abort signal with existing options
      const mergedOptions = {
        ...options,
        signal: controller.signal,
        headers: {
          ...options?.headers,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };
      
      // Make the request with error handling
      return fetch(url, mergedOptions)
        .then(response => {
          clearTimeout(timeoutId);
          
          // Check for HTML responses, which indicate an error
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            console.error('Supabase returned HTML instead of JSON - likely an error');
            throw new Error('Received HTML response instead of JSON from Supabase');
          }
          
          return response;
        })
        .catch(err => {
          clearTimeout(timeoutId);
          console.error("Supabase fetch error:", err.message);
          throw err;
        });
    },
  },
});

/**
 * Track connection status listeners
 */
const connectionStatusListeners: ((isConnected: boolean) => void)[] = [];
let lastConnectionStatus = false;
let connectionCheckInProgress = false;

// Add a listener for connection status changes
export function onConnectionStatusChange(callback: (isConnected: boolean) => void) {
  connectionStatusListeners.push(callback);
  return () => {
    const index = connectionStatusListeners.indexOf(callback);
    if (index !== -1) {
      connectionStatusListeners.splice(index, 1);
    }
  };
}

// Check connection status and notify listeners of changes
export async function checkConnection(): Promise<boolean> {
  if (connectionCheckInProgress) {
    return lastConnectionStatus;
  }
  
  connectionCheckInProgress = true;
  try {
    // First try a lightweight fetch to check if the Supabase API is accessible at all
    try {
      const networkCheck = await fetch(supabaseUrl, {
        method: 'HEAD',
        mode: 'no-cors', // Avoid CORS preflight
        cache: 'no-store', // Don't use cache
        headers: { 'Cache-Control': 'no-cache' },
        signal: AbortSignal.timeout(3000) // Timeout after 3 seconds
      }).catch(err => {
        console.log("Network check failed:", err.message);
        return { ok: false };
      });
      
      if (!networkCheck.ok) {
        console.warn("Network connectivity issue detected");
        
        // Update connection status to false if it was previously true
        if (lastConnectionStatus) {
          lastConnectionStatus = false;
          connectionStatusListeners.forEach(listener => listener(false));
        }
        
        return false;
      }
    } catch (netError) {
      console.error("Network check error:", netError);
      // Proceed to auth check anyway as a fallback
    }
    
    // Now check auth session (more reliable method to verify connection)
    const { data, error } = await supabase.auth.getSession();
    const isConnected = !error;
    
    // Only notify on status change
    if (isConnected !== lastConnectionStatus) {
      console.log(`Supabase connection status changed: ${isConnected ? "Connected" : "Disconnected"}`);
      lastConnectionStatus = isConnected;
      connectionStatusListeners.forEach(listener => listener(isConnected));
    }
    
    return isConnected;
  } catch (error) {
    console.error("Error checking Supabase connection:", error);
    
    // If we get an error, we're disconnected
    if (lastConnectionStatus) {
      lastConnectionStatus = false;
      connectionStatusListeners.forEach(listener => listener(false));
    }
    
    return false;
  } finally {
    connectionCheckInProgress = false;
  }
}

// Test the connection on initialization
checkConnection().then(isConnected => {
  console.log(`Initial Supabase connection check: ${isConnected ? "Connected" : "Disconnected"}`);
}).catch(err => {
  console.error("Initial Supabase connection check failed:", err.message);
});

/**
 * Save a stress assessment to the database
 * With retry logic and better error handling
 */
export async function saveStressAssessment(data: any, maxRetries = 2): Promise<any> {
  let retryCount = 0;
  
  async function attempt(): Promise<any> {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries + 1} to save stress assessment to Supabase...`);
    
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
      
      // First verify connection to Supabase is working
      const isConnected = await checkConnection();
      if (!isConnected && retryCount === 0) {
        console.log("Connection check failed, but will try to save anyway");
      }
      
      console.log("Using API endpoint to save stress assessment...");
      
      // Use the new API endpoint
      const response = await fetch('/api/stress-assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          userId,
          score: parsedScore,
          symptoms: Array.isArray(symptoms) ? symptoms : [],
          triggers: Array.isArray(triggers) ? triggers : [],
          notes: notes || '',
          responses
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Unknown error saving assessment');
      }
      
      console.log("Assessment saved successfully via API:", result);
      return result.assessment;
    } catch (error: any) {
      // If we've retried the maximum number of times, throw the error
      if (retryCount >= maxRetries) {
        throw error;
      }
      
      // Otherwise retry
      retryCount++;
      console.log(`Error saving assessment, retrying (${retryCount}/${maxRetries})...`, error);
      
      // Add exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, retryCount), 8000);
      await new Promise(resolve => setTimeout(resolve, backoffMs));
      
      return attempt();
    }
  }
  
  return attempt();
}

/**
 * Update user's stress metrics based on a new assessment score
 */
async function updateStressMetrics(userId: string, score: number): Promise<void> {
  try {
    // First check if metrics already exist for this user
    const { data: existingMetrics, error: lookupError } = await supabase
      .from('user_assessment_metrics')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (lookupError) {
      console.error("Error looking up metrics:", lookupError);
      return;
    }
    
    const timestamp = new Date().toISOString();
    
      if (existingMetrics) {
        // Update existing metrics
      const totalAssessments = existingMetrics.total_assessments + 1;
      const newAvgScore = (existingMetrics.average_score * existingMetrics.total_assessments + score) / totalAssessments;
      
        const { error: updateError } = await supabase
          .from('user_assessment_metrics')
          .update({
          average_score: newAvgScore,
          total_assessments: totalAssessments,
          last_assessment_score: score,
          last_assessment_at: timestamp,
          updated_at: timestamp
          })
          .eq('user_id', userId);
        
        if (updateError) {
        console.error("Error updating metrics:", updateError);
        }
      } else {
      // Create new metrics record
      const { error: insertError } = await supabase
          .from('user_assessment_metrics')
          .insert({
            user_id: userId,
          average_score: score,
          total_assessments: 1,
          last_assessment_score: score,
          last_assessment_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp
        });
      
      if (insertError) {
        console.error("Error creating metrics:", insertError);
      }
    }
  } catch (error) {
    console.error("Error in updateStressMetrics:", error);
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
    const { user_id, mood_score, assessment_result, notes, mood_description, factors } = data;
    
    // Validate required fields
    if (!user_id) {
      throw new Error("User ID is required for saving mood entry");
    }
    
    const parsedScore = parseFloat(mood_score.toString());
    if (isNaN(parsedScore)) {
      throw new Error("Invalid mood score value");
    }
    
    // Prepare entry data for database - map to proper database field names
    const entryData = {
      patient_id: user_id, // Map user_id to patient_id for DB compatibility
      mood_score: parsedScore,
      mood_description: mood_description || '',
      assessment_result: assessment_result || '',
      factors: factors || [],
      notes: notes || '',
      recorded_at: new Date().toISOString() // Use recorded_at instead of created_at
    };
    
    console.log("Formatted mood entry data:", JSON.stringify(entryData, null, 2));
    
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
    
    // Save the mood entry to Supabase
    console.log("Inserting mood entry into mood_entries table...");
    try {
    const { data: savedEntry, error } = await supabase
      .from('mood_entries')
      .insert(entryData)
        .select();
    
    if (error) {
      console.error("Error inserting mood entry:", error.message, error.details);
        
        // Handle potential field name error
        if (error.message.includes("does not exist") || 
            error.message.includes("column") || 
            error.message.includes("field")) {
          console.error("Database schema error. Make sure field names match the database:", error);
          
          // If there's a specific error about a column missing, log it clearly
          const columnMatch = error.message.match(/column "([^"]+)" does not exist/);
          if (columnMatch && columnMatch[1]) {
            console.error(`The column "${columnMatch[1]}" does not exist in the mood_entries table.`);
          }
        }
        
        // If table doesn't exist, create it and retry
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          try {
            await supabase.rpc('create_mood_entries_table');
            
            // Try the insert again after creating the table
            const { data: retryData, error: retryError } = await supabase
              .from('mood_entries')
              .insert(entryData)
              .select();
              
            if (retryError) {
              console.error("Error inserting after table creation:", retryError);
              return null;
            }
            
            console.log("Mood entry inserted after table creation:", retryData);
            return Array.isArray(retryData) ? retryData[0] : retryData;
          } catch (createTableError) {
            console.error("Error in table creation process:", createTableError);
            return null;
          }
        }
        
        // Try alternative approach by executing direct SQL
        try {
          console.log("Attempting direct SQL approach...");
          
          // First check if table exists
          const { count, error: countError } = await supabase
            .from('mood_entries')
            .select('*', { count: 'exact', head: true });
          
          if (countError) {
            console.error("Error checking table existence:", countError);
            throw error; // Rethrow original error
          }
          
          // If we get here, table exists but might have different column structure
          // Try to select only the essential columns
          try {
            // Try inserting with minimal fields
            const minimal = {
              patient_id: entryData.patient_id,
              mood_score: entryData.mood_score,
              assessment_result: entryData.assessment_result,
              recorded_at: entryData.recorded_at
            };
            
            console.log("Trying minimal insert:", minimal);
            
            const { data: minimalData, error: minimalError } = await supabase
              .from('mood_entries')
              .insert(minimal)
              .select();
            
            if (minimalError) {
              console.error("Minimal insert also failed:", minimalError);
              throw error; // Rethrow original error
            }
            
            console.log("Minimal insert worked:", minimalData);
            return Array.isArray(minimalData) ? minimalData[0] : minimalData;
          } catch (minimalError) {
            console.error("Error with minimal fields approach:", minimalError);
            throw error; // Rethrow original error
          }
        } catch (alternativeError) {
          console.error("Alternative approach also failed:", alternativeError);
          throw error; // Rethrow original error
        }
      }
      
      // Extract first result if array is returned
      const result = Array.isArray(savedEntry) ? savedEntry[0] : savedEntry;
      console.log("Mood entry inserted successfully:", result);
      return result;
    } catch (dbError) {
      console.error("Database error saving mood entry:", dbError);
      throw dbError;
    }
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