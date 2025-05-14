import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/environment';

/**
 * Utility endpoint to force a fresh database connection
 * This can help when the connection pool gets stale or connections time out
 */
export async function GET() {
  // Define response headers up front to ensure they're included in all responses
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    // Add CORS headers
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
  };

  try {
    console.log('Attempting to establish a fresh database connection...');
    
    // First, check if we can reach the Supabase URL directly
    try {
      const connectivityCheck = await fetch(SUPABASE_URL, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        headers: { 
          'Cache-Control': 'no-cache', 
          'Pragma': 'no-cache',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        signal: AbortSignal.timeout(5000)
      });
      
      console.log(`Connectivity check to ${SUPABASE_URL} status: ${connectivityCheck.status}`);
    } catch (connectivityError: any) {
      console.error('Error connecting to Supabase URL:', connectivityError.message);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to reach Supabase server',
        error: {
          message: connectivityError.message || 'Network connectivity issue',
          type: 'connectivity'
        },
        timestamp: new Date().toISOString()
      }, { status: 503, headers });
    }
    
    // Create a completely new client instance with robust configuration
    const freshClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'X-Client-Info': 'supabase-js/2.x',
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`
        },
        fetch: (url, options) => {
          console.log(`Making Supabase request to: ${typeof url === 'string' ? url : 'fetch request'}`);
          
          // Add timeout to avoid hanging requests
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          // Ensure the API key is included in each request
          const mergedOptions = {
            ...options,
            signal: controller.signal,
            headers: {
              ...options?.headers,
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`
            }
          };
          
          return fetch(url, mergedOptions)
            .then(response => {
              clearTimeout(timeoutId);
              
              // Debug response status
              console.log(`Supabase response status: ${response.status}`);
              
              // Check for non-success status code
              if (response.status >= 400) {
                console.error(`Supabase returned error status: ${response.status}`);
                throw new Error(`Supabase responded with error status: ${response.status}`);
              }
              
              // Check if we're getting HTML instead of JSON
              if (response.headers.get('content-type')?.includes('text/html')) {
                console.error('Received HTML response instead of JSON');
                throw new Error('Unexpected HTML response from Supabase');
              }
              
              return response;
            })
            .catch(err => {
              clearTimeout(timeoutId);
              console.error("Fresh client fetch error:", err.message);
              throw err;
            });
        },
      },
    });
    
    // Try querying with the fresh client
    console.log('Testing fresh client with a simple query...');
    try {
      const { data, error } = await freshClient
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('Fresh client connection failed:', error);
        
        return NextResponse.json({
          success: false,
          message: 'Failed to establish a fresh database connection',
          error: {
            message: error.message || 'Database connection error',
            code: error.code || 'UNKNOWN',
            details: error.details || 'No additional details'
          },
          timestamp: new Date().toISOString()
        }, { status: 500, headers });
      }
      
      // Update the global supabase instance in memory
      // Note: This won't affect other requests in the serverless environment
      // But will help debugging
      console.log('Fresh Supabase client connection succeeded');
      
      // Connection established successfully
      return NextResponse.json({
        success: true,
        message: 'Successfully established a fresh database connection',
        connectionInfo: {
          url: SUPABASE_URL.replace(/^(https?:\/\/[^\/]+).*$/, '$1'), // Only show domain, not full URL with key
          timestamp: new Date().toISOString()
        }
      }, { headers });
    } catch (queryError: any) {
      console.error('Fresh client query failed:', queryError.message);
      
      return NextResponse.json({
        success: false,
        message: 'Failed to query with fresh database connection',
        error: {
          message: queryError.message || 'Unknown query error',
          type: queryError.name || 'QueryError',
          stack: process.env.NODE_ENV === 'development' ? queryError.stack : undefined
        },
        timestamp: new Date().toISOString()
      }, { status: 500, headers });
    }
  } catch (error: any) {
    console.error('Unexpected error in db-fix:', error);
    
    return NextResponse.json({
      success: false,
      message: 'An unexpected error occurred while fixing database connection',
      error: {
        message: error.message || 'Unknown error',
        type: error.name || 'Error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500, headers });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
} 