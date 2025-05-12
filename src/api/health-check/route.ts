import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog, errorLog } from '@/utils/environment';

/**
 * Interface for database details
 */
interface DbDetails {
  message: string;
  error?: string;
}

/**
 * Health check endpoint to verify API and database connectivity
 * This helps diagnose issues with the application's backend services
 */
export async function GET() {
  try {
    devLog("Health check requested");
    
    // Check Supabase database connection
    let dbConnected = false;
    let dbDetails: DbDetails = { message: "Not checked" };
    
    try {
      // Perform a simple query to check database connectivity
      const { data, error } = await supabase
        .from('system_health')
        .select('created_at')
        .limit(1);
      
      if (error) {
        // If table doesn't exist, try another common table
        const { data: altData, error: altError } = await supabase
          .from('stress_assessments')
          .select('created_at')
          .limit(1);
          
        if (altError) {
          // Try one more table that should exist
          const { data: userCheck, error: userError } = await supabase
            .from('user_profiles')
            .select('id')
            .limit(1);
            
          if (userError) {
            dbConnected = false;
            dbDetails = { 
              message: "Database connection failed", 
              error: userError.message
            };
          } else {
            dbConnected = true;
            dbDetails = { message: "Connected via user_profiles" };
          }
        } else {
          dbConnected = true;
          dbDetails = { message: "Connected via stress_assessments" };
        }
      } else {
        dbConnected = true;
        dbDetails = { message: "Connected via system_health" };
      }
    } catch (dbError: any) {
      errorLog("Health check database error:", dbError);
      dbConnected = false;
      dbDetails = { 
        message: "Database connection error", 
        error: dbError.message || "Unknown error" 
      };
    }
    
    // Check authentication service
    let authServiceWorking = false;
    try {
      const { data, error } = await supabase.auth.getSession();
      authServiceWorking = !error;
    } catch (authError) {
      errorLog("Auth service check failed:", authError);
      authServiceWorking = false;
    }

    // Return health status
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: dbConnected,
        auth: authServiceWorking
      },
      details: {
        database: dbDetails
      }
    });
  } catch (error: any) {
    errorLog("Health check failed:", error);
    
    return NextResponse.json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: error.message || "Unknown error",
      services: {
        api: true,
        database: false,
        auth: false
      }
    }, { status: 500 });
  }
} 