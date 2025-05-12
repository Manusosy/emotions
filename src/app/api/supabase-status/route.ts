import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_KEY } from '@/lib/environment';

/**
 * API endpoint to check Supabase connection configuration
 * This helps diagnose issues with the Supabase configuration
 */
export async function GET() {
  try {
    // Check if environment variables are properly set
    const url = SUPABASE_URL;
    const key = SUPABASE_KEY;
    
    // Mask the key for security
    const maskedKey = key ? 
      key.substring(0, 6) + '...' + key.substring(key.length - 4) : 
      'Not set';
    
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
      const startTime = Date.now();
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: AbortSignal.timeout(5000)
      });
      
      pingTime = Date.now() - startTime;
      endpointReachable = true;
    } catch (e) {
      pingError = e instanceof Error ? e.message : 'Network error';
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
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking Supabase configuration:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Failed to check Supabase configuration',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 