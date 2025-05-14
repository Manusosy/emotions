import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/environment';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to check Supabase connection configuration
 * This helps diagnose issues with the Supabase configuration
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
    console.log('Starting Supabase status check...');
    
    // Check if environment variables are properly set
    const url = SUPABASE_URL || '';
    const key = SUPABASE_KEY || '';
    
    // Early check for missing credentials
    if (!url || !key) {
      console.error('Missing Supabase credentials');
      return NextResponse.json({
        status: 'configuration_issues',
        supabase_config: {
          url: {
            value: url ? url : 'Not set',
            valid: false,
            error: 'Supabase URL is not configured'
          },
          key: {
            value: key ? (key.substring(0, 6) + '...' + key.substring(key.length - 4)) : 'Not set',
            valid: false
          },
          endpoint: {
            reachable: false,
            error: 'Cannot check endpoint without credentials'
          }
        },
        timestamp: new Date().toISOString()
      }, { headers });
    }
    
    // Mask the key for security
    const maskedKey = key.substring(0, 6) + '...' + key.substring(key.length - 4);
    
    // Test if URL is valid
    let urlIsValid = false;
    let urlError = null;
    
    try {
      const urlObj = new URL(url);
      urlIsValid = urlObj.protocol === 'https:' && 
                   urlObj.hostname.includes('.supabase.co');
    } catch (e) {
      urlError = e instanceof Error ? e.message : 'Invalid URL format';
    }
    
    // Basic test of the key format
    const keyIsValid = typeof key === 'string' && 
                      key.length > 30 && 
                      key.startsWith('ey');
    
    // Try to ping the Supabase endpoint
    let endpointReachable = false;
    let pingTime = null;
    let pingError = null;
    
    try {
      console.log(`Attempting to ping Supabase at: ${url}`);
      const startTime = Date.now();
      
      // Use simpler fetch with abort controller 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(url, {
        method: 'HEAD',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'apikey': key,
          'Authorization': `Bearer ${key}`
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      pingTime = Date.now() - startTime;
      
      // Consider it successful even if we get an error status code
      // (since we're just checking if the endpoint is reachable at all)
      endpointReachable = true;
      
      console.log(`Supabase ping successful: ${response.status} in ${pingTime}ms`);
    } catch (e) {
      pingError = e instanceof Error ? e.message : 'Network error';
      console.error('Supabase ping failed:', pingError);
    }
    
    // Try a basic Supabase query to test full connection
    let querySuccessful = false;
    let queryError = null;
    
    try {
      if (urlIsValid && keyIsValid) {
        console.log('Testing Supabase query with credentials...');
        
        // Create a temporary client with timeout protection
        const testClient = createClient(url, key, {
          auth: { persistSession: false },
          global: {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'apikey': key,
              'Authorization': `Bearer ${key}`
            },
            fetch: (url, options) => {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000);
              
              return fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                  ...options?.headers,
                  'apikey': key,
                  'Authorization': `Bearer ${key}`
                }
              }).then(response => {
                clearTimeout(timeoutId);
                return response;
              }).catch(err => {
                clearTimeout(timeoutId);
                throw err;
              });
            }
          }
        });
        
        // Try a simple query that doesn't require specific tables
        const { data, error } = await testClient.rpc('pg_catalog_has_table_privilege', { 
          table_schema: 'public'
        });
        
        querySuccessful = !error;
        if (error) {
          queryError = error.message;
          console.error('Supabase query test failed:', error);
        } else {
          console.log('Supabase query successful');
        }
      }
    } catch (e) {
      queryError = e instanceof Error ? e.message : 'Query error';
      console.error('Supabase query exception:', e);
    }
    
    // Return the configuration status
    return NextResponse.json({
      status: urlIsValid && keyIsValid && endpointReachable ? 'ok' : 'configuration_issues',
      supabase_config: {
        url: {
          value: url,
          valid: urlIsValid,
          error: urlError
        },
        key: {
          value: maskedKey,
          valid: keyIsValid
        },
        endpoint: {
          reachable: endpointReachable,
          ping_ms: pingTime,
          error: pingError
        },
        query: {
          successful: querySuccessful,
          error: queryError
        }
      },
      timestamp: new Date().toISOString()
    }, { headers });
  } catch (error) {
    console.error('Error checking Supabase configuration:', error);
    
    // Provide a detailed error response instead of just failing
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Supabase configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: process.env.NODE_ENV === 'development' && error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 200, headers }); // Return 200 instead of 500 to ensure clients can read the response
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