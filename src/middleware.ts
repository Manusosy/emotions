import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { mockAuthApi } from './api-server/auth';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;
  
  console.log('Middleware processing request for:', path);
  
  // Handle API requests
  if (path.startsWith('/api/')) {
    console.log('Processing API request:', path);
    
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    
    // For auth/register endpoints, ensure they're properly routed
    if (path.includes('/auth/') && path.includes('/register')) {
      console.log('Processing registration request:', path);
    }
    
    // Continue to the actual API route
    return NextResponse.next();
  }
  
  // Continue for non-API requests
  return NextResponse.next();
}

// Configure the middleware to run only on API routes
export const config = {
  matcher: ['/api/:path*'],
};

// API request interceptor middleware
export function setupAPIInterceptor() {
  // Store the original fetch implementation
  const originalFetch = window.fetch;

  // Override the fetch method to intercept API calls
  window.fetch = async function(input: RequestInfo | URL, init?: RequestInit) {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || 'GET';
    
    console.log(`Intercepted API call: ${method} ${url}`);
    
    // Handle auth API endpoints
    if (url.includes('/api/auth/')) {
      return handleAuthAPI(url, method, init);
    }
    
    // Add this section to route patient API requests
    if (url.includes('/api/patients/')) {
      return handlePatientAPI(url, method, init);
    }
    
    // Pass through to the original fetch for non-intercepted calls
    return originalFetch(input, init);
  } as typeof fetch;
  
  console.log('API interceptor middleware set up successfully');
}

// Handle authentication API endpoints
async function handleAuthAPI(url: string, method: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  
  console.log(`Handling auth API request: ${method} ${path}`);
  
  // Extract request body if present
  let body: Record<string, any> = {};
  if (init?.body) {
    try {
      body = JSON.parse(init.body as string);
      console.log('Request payload:', { 
        ...body, 
        password: body.password ? '[REDACTED]' : undefined 
      });
    } catch (e) {
      console.error('Failed to parse request body:', e);
    }
  }

  // Handle different auth endpoints
  if (path.includes('/api/auth/patient/register') && method === 'POST') {
    // Patient registration
    const result = mockAuthApi.register(body, 'patient');
    return createMockResponse(result);
  }
  
  if (path.includes('/api/auth/mentor/register') && method === 'POST') {
    // Mentor registration
    const result = mockAuthApi.register(body, 'mood_mentor');
    return createMockResponse(result);
  }
  
  if (path.includes('/api/auth/login') && method === 'POST') {
    // Login
    const result = mockAuthApi.login(
      body.email as string, 
      body.password as string, 
      body.role as string
    );
    return createMockResponse(result);
  }
  
  if (path.includes('/api/auth/session') && method === 'GET') {
    // Session check - for now just return no session
    return createMockResponse({
      success: false,
      error: { message: 'No active session' }
    });
  }
  
  if (path.includes('/api/auth/logout') && method === 'POST') {
    // Logout - just return success
    return createMockResponse({
      success: true,
      data: null
    });
  }
  
  // Fallback for unhandled auth routes
  console.warn(`Unhandled auth API route: ${method} ${path}`);
  return createMockResponse({
    success: false,
    error: { message: 'API endpoint not implemented in mock server' }
  }, 404);
}

// Handle patient API endpoints
async function handlePatientAPI(url: string, method: string, init?: RequestInit): Promise<Response> {
  const urlObj = new URL(url, window.location.origin);
  const path = urlObj.pathname;
  const userId = path.match(/\/api\/patients\/([^\/]+)/)?.[1];
  
  console.log(`Handling patient API request: ${method} ${path} for user ${userId}`);
  
  // Mock patient profile data
  if (path.includes(`/api/patients/${userId}/profile`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: {
        id: userId,
        patient_id: 'EMHA-' + userId.substring(0, 5),
        first_name: 'Demo',
        last_name: 'Patient',
        email: 'patient@example.com',
        phone_number: '+1 (555) 123-4567',
        date_of_birth: '1990-01-01',
        gender: 'Female',
        country: 'United States',
        address: '123 Main St',
        city: 'New York',
        state: 'NY',
        pincode: '10001',
        avatar_url: 'https://api.dicebear.com/6.x/micah/svg?seed=patient',
        created_at: new Date().toISOString()
      }
    });
  }
  
  // Mock appointments data
  if (path.includes(`/api/patients/${userId}/appointments`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: [
        {
          id: 'apt-001',
          date: '2023-11-15',
          time: '10:00 AM',
          type: 'Video Consultation',
          status: 'upcoming',
          ambassador: {
            name: 'Dr. Sophie Chen',
            specialization: 'Psychiatrist'
          },
          notes: 'Follow-up on medication efficacy'
        },
        {
          id: 'apt-002',
          date: '2023-11-22',
          time: '2:30 PM',
          type: 'Phone Call',
          status: 'upcoming',
          ambassador: {
            name: 'Michael Roberts',
            specialization: 'Wellness Coach'
          },
          notes: 'Weekly check-in'
        },
        {
          id: 'apt-003',
          date: '2023-10-10',
          time: '9:00 AM',
          type: 'Video Consultation',
          status: 'completed',
          ambassador: {
            name: 'Dr. Sophie Chen',
            specialization: 'Psychiatrist'
          },
          notes: 'Initial evaluation'
        }
      ]
    });
  }
  
  // Mock messages data
  if (path.includes(`/api/patients/${userId}/messages`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: [
        {
          id: 'msg-001',
          sender: {
            id: 'sender-001',
            full_name: 'Dr. Sophie Chen',
            avatar_url: 'https://api.dicebear.com/6.x/micah/svg?seed=sophie'
          },
          content: 'Hello! How are you feeling today?',
          created_at: new Date(Date.now() - 3600000).toISOString(),
          timestamp: '1 hour ago',
          unread: false
        },
        {
          id: 'msg-002',
          sender: {
            id: 'sender-002',
            full_name: 'Michael Roberts',
            avatar_url: 'https://api.dicebear.com/6.x/micah/svg?seed=michael'
          },
          content: 'Your next appointment is confirmed for Wednesday.',
          created_at: new Date(Date.now() - 7200000).toISOString(),
          timestamp: '2 hours ago',
          unread: true
        }
      ]
    });
  }
  
  // Mock support groups data
  if (path.includes('/api/support-groups') && method === 'GET') {
    return createMockResponse({
      success: true,
      data: [
        {
          id: 'group-001',
          name: 'Anxiety Support',
          description: 'A group for people dealing with anxiety.',
          members: 28,
          nextMeeting: '2023-11-18T15:00:00Z',
          mentor: {
            name: 'Dr. James Wilson',
            avatar_url: 'https://api.dicebear.com/6.x/micah/svg?seed=james'
          }
        },
        {
          id: 'group-002',
          name: 'Depression Recovery',
          description: 'Supporting each other through depression.',
          members: 32,
          nextMeeting: '2023-11-20T18:00:00Z',
          mentor: {
            name: 'Dr. Sophie Chen',
            avatar_url: 'https://api.dicebear.com/6.x/micah/svg?seed=sophie'
          }
        }
      ]
    });
  }
  
  // Mock journal entries data
  if (path.includes(`/api/patients/${userId}/journal-entries`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: [
        {
          id: 'journal-001',
          title: 'Feeling better today',
          content: 'I tried the meditation technique and felt much calmer afterward.',
          mood_rating: 4,
          created_at: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 'journal-002',
          title: 'Difficult day at work',
          content: 'Stress levels were high, but I managed to use breathing exercises.',
          mood_rating: 2,
          created_at: new Date(Date.now() - 172800000).toISOString()
        }
      ]
    });
  }
  
  // Mock user metrics data
  if (path.includes(`/api/patients/${userId}/metrics`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: {
        moodScore: 3.5,
        stressLevel: 2.8,
        consistency: 75,
        lastCheckInStatus: 'Good',
        streak: 3,
        firstCheckInDate: new Date(Date.now() - 604800000).toISOString()
      }
    });
  }
  
  // Mock appointment reports data
  if (path.includes(`/api/patients/${userId}/appointment-reports`) && method === 'GET') {
    return createMockResponse({
      success: true,
      data: [
        {
          id: 'EMHA01',
          date: '15 Nov 2023',
          time: '10:00 AM',
          type: 'Video Consultation',
          status: 'Upcoming',
          ambassador: {
            name: 'Dr. Sophie Chen',
            specialization: 'Psychiatrist'
          },
          notes: 'Follow-up on medication efficacy'
        },
        {
          id: 'EMHA02',
          date: '22 Nov 2023',
          time: '2:30 PM',
          type: 'Phone Call',
          status: 'Upcoming',
          ambassador: {
            name: 'Michael Roberts',
            specialization: 'Wellness Coach'
          },
          notes: 'Weekly check-in'
        },
        {
          id: 'EMHP01',
          date: '10 Oct 2023',
          time: '9:00 AM',
          type: 'Video Consultation',
          status: 'Completed',
          ambassador: {
            name: 'Dr. Sophie Chen',
            specialization: 'Psychiatrist'
          },
          notes: 'Initial evaluation'
        }
      ]
    });
  }
  
  // Fallback for unhandled patient routes
  console.warn(`Unhandled patient API route: ${method} ${path}`);
  return createMockResponse({
    success: false,
    error: { message: 'API endpoint not implemented' }
  }, 404);
}

// Create a mock response object that implements the Response interface
function createMockResponse(data: any, status = 200): Response {
  const body = JSON.stringify(data);
  const headers = new Headers({
    'Content-Type': 'application/json'
  });
  
  return new Response(body, {
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers
  });
} 