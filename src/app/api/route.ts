import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Root API GET handler invoked for:', url.pathname);
  
  return NextResponse.json({
    message: 'API is running',
    endpoints: {
      auth: {
        register: {
          patient: '/api/auth/patient/register',
          mentor: '/api/auth/mentor/register'
        },
        login: {
          patient: '/api/auth/patient/login',
          mentor: '/api/auth/mentor/login'
        }
      }
    }
  });
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  console.log('Root API POST handler invoked for:', url.pathname);
  
  return NextResponse.json({
    message: 'POST request received at root API handler',
    path: url.pathname
  }, { status: 404 });
} 