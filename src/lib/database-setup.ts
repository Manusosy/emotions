import { supabase } from '@/lib/supabase';

/**
 * Utility function to check and create required database tables
 */
export async function setupDatabase() {
  try {
    console.log("Checking and setting up database tables...");
    
    // Call the API route for table creation
    const response = await fetch('/api/create-tables');
    const data = await response.json();
    
    console.log("Database setup result:", data);
    return data;
  } catch (error) {
    console.error("Error setting up database:", error);
    return {
      success: false,
      message: "Failed to set up database",
      error: String(error)
    };
  }
}

/**
 * Check if a table exists in the database
 */
export async function tableExists(tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .select('count(*)', { count: 'exact', head: true });
    
    return !error;
  } catch (error) {
    console.error(`Error checking if ${tableName} exists:`, error);
    return false;
  }
} 