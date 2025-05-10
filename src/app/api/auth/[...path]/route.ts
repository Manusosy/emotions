import { NextRequest, NextResponse } from 'next/server';
import { handleAuthRoute } from '@/api/auth/routes';

// Common debug and error handler wrapper
async function processRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const fullPath = params.path.join('/');
    console.log(`[API Route] ${method} /api/auth/${fullPath} - Processing request`);
    
    // Add CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Special case for signup endpoints
    if (fullPath === 'patient/register' || fullPath === 'mentor/register') {
      console.log(`[API Route] Processing ${fullPath} registration request`);
      
      // Directly map to the appropriate handler
      let body;
      try {
        body = await request.json();
        console.log('Request body:', { ...body, password: '[REDACTED]', confirmPassword: '[REDACTED]' });
      } catch (e) {
        console.error('Failed to parse request body');
      }
    }
    
    const response = await handleAuthRoute(request, fullPath);
    
    // Clone the response and add CORS headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error(`[API Route] Error processing ${method} request:`, error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS preflight requests
export async function OPTIONS(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return new NextResponse(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return processRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return processRequest(request, params, 'POST');
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return processRequest(request, params, 'PUT');
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return processRequest(request, params, 'DELETE');
} 