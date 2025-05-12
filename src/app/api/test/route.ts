import { NextResponse } from 'next/server';

/**
 * Simple API test endpoint that doesn't require database connectivity
 * Useful for diagnosing API connection issues separately from database issues
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'API is working',
    timestamp: new Date().toISOString()
  });
} 