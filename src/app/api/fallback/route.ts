import { NextRequest, NextResponse } from 'next/server';

// Configure CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { 
    status: 204,
    headers: corsHeaders,
  });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Fallback GET handler for:', url.pathname);
  
  return NextResponse.json(
    { message: 'Fallback route handler', path: url.pathname },
    { status: 200, headers: corsHeaders }
  );
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Fallback POST handler for:', url.pathname);
  
  // Check if this is an auth registration endpoint
  if (url.pathname.includes('/api/auth/') && url.pathname.includes('/register')) {
    try {
      const body = await request.json();
      console.log('Registration request body:', { ...body, password: '[REDACTED]' });
      
      // Create a mock registration response
      return NextResponse.json(
        { 
          message: 'Registration successful via fallback',
          user: {
            id: 'fallback-123',
            email: body.email || 'test@example.com',
            role: body.role || 'patient'
          }
        },
        { status: 200, headers: corsHeaders }
      );
    } catch (e) {
      console.error('Failed to parse request body:', e);
    }
  }
  
  return NextResponse.json(
    { message: 'Fallback route handler', path: url.pathname },
    { status: 200, headers: corsHeaders }
  );
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Fallback PUT handler for:', url.pathname);
  
  return NextResponse.json(
    { message: 'Fallback route handler', path: url.pathname },
    { status: 200, headers: corsHeaders }
  );
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Fallback DELETE handler for:', url.pathname);
  
  return NextResponse.json(
    { message: 'Fallback route handler', path: url.pathname },
    { status: 200, headers: corsHeaders }
  );
} 