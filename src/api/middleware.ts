import { NextRequest, NextResponse } from 'next/server';
import { handleAuthRoute } from './auth/routes';

export async function middleware(req: NextRequest) {
  const url = new URL(req.url);
  const pathname = url.pathname;
  
  // Only handle API requests
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  // Extract the API path (without /api/ prefix)
  const apiPath = pathname.substring(5); // Remove /api/
  
  try {
    // Route to the correct handler based on the path
    if (apiPath.startsWith('auth/')) {
      return handleAuthRoute(req, apiPath);
    }
    
    // Handle other API routes here
    // For example:
    // if (apiPath.startsWith('patients/')) {
    //   return handlePatientRoute(req, apiPath);
    // }
    
    // No handler found
    return NextResponse.json({ message: 'API route not found' }, { status: 404 });
  } catch (error) {
    console.error('API middleware error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 