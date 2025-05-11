import { NextResponse } from 'next/server';

// Mock patient profile data
const mockProfiles = {
  'default': {
    id: 'pat_123456',
    patient_id: 'P12345',
    first_name: 'Alex',
    last_name: 'Johnson',
    email: 'alex.johnson@example.com',
    phone: '+1234567890',
    date_of_birth: '1990-05-15',
    address: '123 Main St, Anytown, USA',
    emergency_contact: 'Sarah Johnson, +0987654321',
    medical_conditions: ['Anxiety', 'Mild depression'],
    medications: ['Sertraline 50mg daily'],
    avatar_url: null,
    created_at: '2023-01-15T08:30:00Z',
    updated_at: '2023-04-20T14:45:00Z'
  }
};

/**
 * GET /api/patients/[id]/profile
 * Retrieve a patient's profile by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Return the mock data or default if not found
    const profile = mockProfiles[id] || mockProfiles.default;
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 