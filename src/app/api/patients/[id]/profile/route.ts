import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // Get user information
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, phone_number, avatar_url, created_at, updated_at')
      .eq('id', id)
      .single();
    
    if (userError) {
      console.error('Error fetching user data:', userError);
      return new NextResponse('User not found', { status: 404 });
    }
    
    // Get patient profile data
    const { data: profileData, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id, date_of_birth, gender, emergency_contact, medical_conditions, preferences')
      .eq('user_id', id)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error fetching patient profile:', profileError);
      return new NextResponse('Error fetching patient profile', { status: 500 });
    }
    
    // Format and combine the data
    const profile = {
      id: userData.id,
      patient_id: `P${userData.id.substring(0, 5)}`,
      first_name: userData.full_name?.split(' ')[0] || '',
      last_name: userData.full_name?.split(' ').slice(1).join(' ') || '',
      email: userData.email,
      phone: userData.phone_number || '',
      date_of_birth: profileData?.date_of_birth || null,
      address: profileData?.preferences?.address || '',
      emergency_contact: profileData?.emergency_contact || '',
      medical_conditions: profileData?.medical_conditions || [],
      medications: profileData?.preferences?.medications || [],
      avatar_url: userData.avatar_url,
      created_at: userData.created_at,
      updated_at: userData.updated_at
    };
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 