/**
 * API Mock System
 * 
 * This file implements client-side API mocking to allow the app to work
 * without a functioning backend API. This is especially useful for development
 * and onboarding new mood mentors when the backend might be unavailable.
 */

// Store to track if mocking is enabled
let mockingEnabled = false;

// Mock database for storing mentor profiles
const mockDatabase = {
  mentorProfiles: [] as any[],
  users: [] as any[]
};

/**
 * Initialize the API mocking system
 */
export function initApiMocking() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  console.log('Initializing API mocking system');
  
  // Enable mocking
  mockingEnabled = true;
  window.__DB_FALLBACK_ENABLED = true;
  
  // Create default mock data if needed
  createMockData();
  
  // Intercept fetch requests to API endpoints
  interceptFetch();
}

/**
 * Create initial mock data
 */
function createMockData() {
  // Create some sample mentor profiles if none exist
  if (mockDatabase.mentorProfiles.length === 0) {
    mockDatabase.mentorProfiles = [
      {
        id: 'mock-mentor-1',
        userId: 'user1',
        firstName: 'Jane',
        lastName: 'Smith',
        title: 'Stress Management Specialist',
        bio: 'Helping people manage stress and anxiety for over 10 years.',
        specialties: ['Stress', 'Anxiety', 'Mindfulness'],
        rating: 4.8,
        reviewCount: 24,
        profileComplete: true,
        location: 'New York, NY',
        availability: true
      },
      {
        id: 'mock-mentor-2',
        userId: 'user2',
        firstName: 'Michael',
        lastName: 'Johnson',
        title: 'Mood and Emotion Counselor',
        bio: 'Specializing in emotional intelligence and mood regulation techniques.',
        specialties: ['Depression', 'Mood Disorders', 'Emotional Regulation'],
        rating: 4.6,
        reviewCount: 18,
        profileComplete: true,
        location: 'Chicago, IL',
        availability: true
      }
    ];
  }
}

/**
 * Intercept fetch calls to API endpoints
 */
function interceptFetch() {
  // Only monkey patch fetch if we're in the browser and mocking is enabled
  if (typeof window === 'undefined' || typeof fetch === 'undefined') return;
  
  console.log('Setting up fetch interception for API mocking');
  
  // Store the original fetch function
  const originalFetch = window.fetch;
  
  // Replace fetch with our mock version
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Only intercept API calls when mocking is enabled
    if (!mockingEnabled) {
      return originalFetch(input, init);
    }
    
    const url = input.toString();
    
    // If this is an API call, handle it with mock data
    if (url.includes('/api/')) {
      return handleMockApiRequest(url, init);
    }
    
    // Otherwise use the original fetch
    return originalFetch(input, init);
  };
}

/**
 * Handle a mocked API request
 */
async function handleMockApiRequest(url: string, init?: RequestInit): Promise<Response> {
  console.log(`Handling mock API request: ${url}`);
  
  // Add a small delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 200));
  
  // Core system endpoints
  if (url.includes('/api/system-check') || url.includes('/api/health-check')) {
    return createSuccessResponse({
      status: 'ok',
      message: 'System is operational (mocked)',
      timestamp: new Date().toISOString()
    });
  }
  
  // Test endpoints
  if (url.includes('/api/test') || url.includes('/api/test-db')) {
    return createSuccessResponse({
      success: true,
      message: 'API is online (mocked)',
      data: {
        timestamp: new Date().toISOString()
      }
    });
  }
  
  // Supabase status endpoint
  if (url.includes('/api/supabase-status')) {
    return createSuccessResponse({
      status: 'ok',
      message: 'Supabase connection is operational (mocked)',
      supabase_config: {
        url: { valid: true },
        key: { valid: true },
        endpoint: { reachable: true, ping_ms: 42 }
      }
    });
  }
  
  // Database fix endpoint
  if (url.includes('/api/db-fix') || url.includes('/api/restart-connection')) {
    return createSuccessResponse({
      success: true,
      message: 'Database connection fixed (mocked)',
      timestamp: new Date().toISOString()
    });
  }
  
  // Mood mentor profiles endpoint
  if (url.includes('/api/mood-mentors')) {
    return createSuccessResponse({
      success: true,
      data: mockDatabase.mentorProfiles,
      count: mockDatabase.mentorProfiles.length
    });
  }
  
  // Mood mentor profile endpoint (specific mentor)
  if (url.match(/\/api\/mood-mentors\/[^\/]+$/)) {
    const mentorId = url.split('/').pop();
    const mentor = mockDatabase.mentorProfiles.find(m => m.id === mentorId);
    
    if (mentor) {
      return createSuccessResponse({
        success: true,
        data: mentor
      });
    } else {
      return createErrorResponse('Mentor not found', 404);
    }
  }
  
  // Default response for unhandled endpoints
  return createSuccessResponse({
    success: true,
    message: 'Mocked API response',
    endpoint: url,
    data: null
  });
}

/**
 * Create a JSON success response
 */
function createSuccessResponse(data: any, status = 200): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Mocked-Response': 'true'
      }
    }
  );
}

/**
 * Create a JSON error response
 */
function createErrorResponse(message: string, status = 500): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Mocked-Response': 'true'
      }
    }
  );
}

// Export functions for direct use
export const apiMock = {
  enable: () => {
    mockingEnabled = true;
    if (typeof window !== 'undefined') {
      window.__DB_FALLBACK_ENABLED = true;
    }
    console.log('API mocking enabled');
  },
  disable: () => {
    mockingEnabled = false;
    if (typeof window !== 'undefined') {
      window.__DB_FALLBACK_ENABLED = false;
    }
    console.log('API mocking disabled');
  },
  isEnabled: () => mockingEnabled,
  getMockData: () => mockDatabase
}; 