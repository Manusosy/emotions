import { NextResponse } from 'next/server';

/**
 * Simple API test endpoint that doesn't require database connectivity
 * Useful for diagnosing API connection issues separately from database issues
 */
export async function GET() {
  // Define response headers for better consistency
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
    // Return a successful response
    return NextResponse.json({
      status: 'ok',
      message: 'API is working',
      timestamp: new Date().toISOString()
    }, { status: 200, headers });
  } catch (error: any) {
    console.error('Unexpected error in API test endpoint:', error);
    
    // Return a more detailed error response
    return NextResponse.json({
      status: 'error',
      message: 'API test endpoint encountered an error',
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