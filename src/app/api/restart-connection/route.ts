import { NextResponse } from 'next/server';
import { supabase, refreshSupabaseClient } from '@/lib/supabase';

/**
 * API endpoint to restart database connections
 * This is useful for resolving stale connections that may be causing 500 errors
 */
export async function POST(request: Request) {
  // Define response headers for better consistency and CORS
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
  };

  try {
    // Attempt to refresh the Supabase client
    console.log('Attempting to refresh Supabase connection...');
    
    // Use our new refresh function to create a new client
    const freshClient = refreshSupabaseClient();
    
    // Test the new connection
    let testResult;
    try {
      // Perform a simple query to test
      const { data, error } = await freshClient
        .from('user_profiles')
        .select('id')
        .limit(1);
        
      testResult = {
        success: !error,
        message: error ? `Test query failed: ${error.message}` : 'Test query succeeded'
      };
    } catch (testError: any) {
      testResult = {
        success: false,
        message: `Test error: ${testError.message}`
      };
    }
    
    // Return success response
    return NextResponse.json({
      status: testResult.success ? 'ok' : 'error',
      message: 'Database connection restart attempted',
      result: testResult
    }, { 
      status: testResult.success ? 200 : 500, 
      headers 
    });
  } catch (error: any) {
    console.error('Error restarting database connection:', error);
    
    // Return error information
    return NextResponse.json({
      status: 'error',
      message: 'Error restarting database connection',
      error: {
        message: error.message || 'Unknown error',
        type: error.name || 'Error'
      }
    }, { 
      status: 500, 
      headers 
    });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
} 