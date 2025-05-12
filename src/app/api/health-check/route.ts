import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { devLog, errorLog } from '@/utils/environment';
import { isOnline } from '@/utils/network';
import { SUPABASE_URL } from '@/lib/environment';

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
export async function GET(request: Request) {
  try {
    devLog("Health check requested");
    const startTime = Date.now();
    
    // First check device connectivity
    const deviceOnline = isOnline();
    
    // Check results for different database connections
    const results = {
      timestamp: new Date().toISOString(),
      device: {
        online: deviceOnline,
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
      supabase: { 
        connected: false, 
        details: { message: "Not checked" } as DbDetails,
        responseTime: null as number | null
      }
    };
    
    // Skip DB checks if device is offline
    if (!deviceOnline) {
      results.supabase.details.message = "Device is offline, skipping DB check";
      return NextResponse.json({
        status: "offline",
        services: { database: false },
        results
      });
    }
    
    // Check Supabase connection with timeout
    try {
      // First check if we can connect to Supabase endpoint
      const endpointCheck = await fetch(SUPABASE_URL, { 
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000) // 3 second timeout
      }).catch(error => {
        return { ok: false, error };
      });
      
      if ('error' in endpointCheck) {
        results.supabase.details = { 
          message: "Supabase endpoint unreachable", 
          error: endpointCheck.error?.message || "Connection timed out"
        };
      } else {
        // Now try to perform an actual query
        const dbCheckStart = Date.now();
        
        try {
          const { data, error } = await supabase
            .from('stress_assessments')
            .select('created_at')
            .limit(1);
          
          results.supabase.responseTime = Date.now() - dbCheckStart;
          
          if (error) {
            // Try one more table that should exist
            try {
              const { data: userCheck, error: userError } = await supabase
                .from('user_profiles')
                .select('id')
                .limit(1);
                
              if (userError) {
                results.supabase.connected = false;
                results.supabase.details = { 
                  message: "Database connection failed", 
                  error: userError.message + (userError.details ? ` (${userError.details})` : '')
                };
              } else {
                results.supabase.connected = true;
                results.supabase.details = { message: "Connected via user_profiles table" };
              }
            } catch (tableError) {
              results.supabase.connected = false;
              results.supabase.details = { 
                message: "Error querying user_profiles table", 
                error: tableError instanceof Error ? tableError.message : String(tableError)
              };
            }
          } else {
            results.supabase.connected = true;
            results.supabase.details = { message: "Connected via stress_assessments table" };
          }
        } catch (queryError) {
          results.supabase.connected = false;
          results.supabase.details = { 
            message: "Error executing database query", 
            error: queryError instanceof Error ? queryError.message : String(queryError)
          };
        }
      }
    } catch (dbError: any) {
      errorLog("Health check database error:", dbError);
      results.supabase.connected = false;
      results.supabase.details = { 
        message: "Database connection error", 
        error: dbError.message || "Unknown error" 
      };
    }
    
    // Check JWT token validity
    let authStatus = {
      valid: false,
      message: "Not checked"
    };
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        authStatus = {
          valid: false,
          message: `Auth error: ${sessionError.message}`
        };
      } else if (sessionData?.session) {
        authStatus = {
          valid: true,
          message: "Valid session"
        };
      } else {
        authStatus = {
          valid: false,
          message: "No active session"
        };
      }
    } catch (authError: any) {
      authStatus = {
        valid: false,
        message: `Auth check failed: ${authError.message}`
      };
    }
    
    // Calculate total response time
    const totalResponseTime = Date.now() - startTime;
    
    // Return comprehensive health check results
    return NextResponse.json({
      status: results.supabase.connected ? "ok" : "error",
      services: {
        database: results.supabase.connected,
        auth: authStatus.valid
      },
      metrics: {
        responseTime: totalResponseTime,
        dbResponseTime: results.supabase.responseTime
      },
      results,
      auth: authStatus
    });
  } catch (error: any) {
    errorLog("Health check unhandled error:", error);
    
    // Provide detailed error for debugging
    return NextResponse.json({
      status: "error",
      services: {
        database: false,
        auth: false
      },
      error: {
        message: error.message || "Unknown error",
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    }, { status: 500 });
  }
} 