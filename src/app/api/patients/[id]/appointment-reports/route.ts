import { NextResponse } from 'next/server';
import { format } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/patients/[id]/appointment-reports
 * Retrieve appointment reports for a patient
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Get patient profile ID from user ID
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', id)
      .single();
    
    if (profileError) {
      console.error('Error finding patient profile:', profileError);
      return new NextResponse('Patient profile not found', { status: 404 });
    }
    
    // Get appointments with session notes for this patient
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        status,
        notes,
        created_at,
        mentor_profiles:mood_mentor_profiles(
          id,
          users:user_id(
            full_name,
            avatar_url
          ),
          specialties
        ),
        session_notes(
          id,
          content,
          action_items,
          mood_progress,
          created_at
        )
      `)
      .eq('patient_id', patientProfile.id)
      .order('start_time', { ascending: false });
    
    if (appointmentsError) {
      console.error('Error fetching appointment reports:', appointmentsError);
      return new NextResponse('Failed to fetch appointment reports', { status: 500 });
    }
    
    // Format the reports
    const reports = appointments.map(apt => {
      // Extract mentor information
      const mentor = apt.mentor_profiles || {};
      const mentorUser = mentor.users && mentor.users.length > 0 ? mentor.users[0] : {};
      const specialization = mentor.specialties && mentor.specialties.length > 0 
        ? mentor.specialties[0] 
        : 'Mood Mentor';
      
      // Extract session note information
      const sessionNote = apt.session_notes && apt.session_notes.length > 0 
        ? apt.session_notes[0] 
        : null;
      
      // Format date and time
      const appointmentDate = new Date(apt.start_time);
      
      return {
        id: apt.id,
        date: format(appointmentDate, 'yyyy-MM-dd'),
        time: format(appointmentDate, 'h:mm a'),
        type: sessionNote ? 'Follow-up Session' : 'Initial Assessment',
        status: apt.status,
        ambassador: {
          name: mentorUser.full_name || 'Unknown Mentor',
          specialization: specialization,
          avatar_url: mentorUser.avatar_url || null
        },
        summary: sessionNote ? sessionNote.content : (apt.notes || 'No summary available'),
        recommendations: sessionNote && sessionNote.action_items ? 
          sessionNote.action_items.join('. ') : 
          'No specific recommendations recorded'
      };
    });
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching appointment reports:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 