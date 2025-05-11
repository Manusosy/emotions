import { NextRequest, NextResponse } from 'next/server';
import { mentorRegister } from '@/api/auth/handlers';

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

export async function POST(request: NextRequest) {
  try {
    console.log('Mentor registration route handler activated');
    
    // Create a mock successful response for testing
    const mockData = {
      message: 'Registration successful',
      user: {
        id: '654321',
        email: 'mentor@example.com',
        role: 'mood_mentor'
      }
    };
    
    // Return the mock response
    return NextResponse.json(mockData, { 
      status: 200, 
      headers: corsHeaders 
    });
    
    /* Uncomment this once we confirm the route is being hit
    // Add CORS headers to the response
    const response = await mentorRegister(request);
    
    // Clone the response to add headers
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...Object.fromEntries(response.headers),
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
    */
  } catch (error) {
    console.error('Error in mentor registration route:', error);
    return NextResponse.json(
      { message: 'Internal server error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500, headers: corsHeaders }
    );
  }
} 