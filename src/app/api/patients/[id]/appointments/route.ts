import { NextResponse } from 'next/server';
import { addDays, format } from 'date-fns';

// Generate mock appointments for the current week
const generateMockAppointments = (patientId: string) => {
  const today = new Date();
  const appointments = [];

  // Add an upcoming appointment for tomorrow
  const tomorrow = addDays(today, 1);
  appointments.push({
    id: `appt_${patientId}_1`,
    date: format(tomorrow, 'yyyy-MM-dd'),
    time: '10:00 AM',
    type: 'Video Consultation',
    status: 'upcoming',
    ambassador: {
      name: 'Dr. Emily Chen',
      specialization: 'Clinical Psychologist'
    },
    notes: 'Initial assessment appointment'
  });

  // Add a completed appointment for yesterday
  const yesterday = addDays(today, -1);
  appointments.push({
    id: `appt_${patientId}_2`,
    date: format(yesterday, 'yyyy-MM-dd'),
    time: '2:30 PM',
    type: 'In-Person Visit',
    status: 'completed',
    ambassador: {
      name: 'Dr. Michael Rodriguez',
      specialization: 'Psychiatrist'
    },
    notes: 'Medication review and therapy session'
  });

  // Add a cancelled appointment
  const lastWeek = addDays(today, -6);
  appointments.push({
    id: `appt_${patientId}_3`,
    date: format(lastWeek, 'yyyy-MM-dd'),
    time: '11:15 AM',
    type: 'Phone Call',
    status: 'cancelled',
    ambassador: {
      name: 'Sarah Johnson',
      specialization: 'Wellness Coach'
    },
    notes: 'Cancelled due to scheduling conflict'
  });

  // Add an upcoming appointment for next week
  const nextWeek = addDays(today, 5);
  appointments.push({
    id: `appt_${patientId}_4`,
    date: format(nextWeek, 'yyyy-MM-dd'),
    time: '3:45 PM',
    type: 'Group Session',
    status: 'upcoming',
    ambassador: {
      name: 'Dr. James Wilson',
      specialization: 'Group Therapist'
    },
    notes: 'Stress management techniques group'
  });

  return appointments;
};

/**
 * GET /api/patients/[id]/appointments
 * Retrieve appointments for a patient
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Generate mock appointments for this patient
    const appointments = generateMockAppointments(id);
    
    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 