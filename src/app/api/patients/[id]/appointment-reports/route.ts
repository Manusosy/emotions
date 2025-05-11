import { NextResponse } from 'next/server';
import { subDays, addDays, format } from 'date-fns';

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
    const today = new Date();
    
    // Mock appointment reports
    const reports = [
      {
        id: 'RPT-2023-001',
        date: format(subDays(today, 7), 'yyyy-MM-dd'),
        time: '10:00 AM',
        type: 'Initial Assessment',
        status: 'completed',
        ambassador: {
          name: 'Dr. Emily Chen',
          specialization: 'Clinical Psychologist',
          avatar_url: null
        },
        summary: 'Initial assessment for stress and anxiety symptoms. Patient reports work-related stress and difficulty sleeping.',
        recommendations: 'Recommended regular check-ins, stress management techniques, and sleep hygiene practices.'
      },
      {
        id: 'RPT-2023-002',
        date: format(subDays(today, 3), 'yyyy-MM-dd'),
        time: '2:30 PM',
        type: 'Follow-up Session',
        status: 'completed',
        ambassador: {
          name: 'Dr. Michael Rodriguez',
          specialization: 'Psychiatrist',
          avatar_url: null
        },
        summary: 'Patient reports improvement in sleep patterns after implementing suggested sleep hygiene practices.',
        recommendations: 'Continue with current practices and add daily mindfulness exercises.'
      },
      {
        id: 'RPT-2023-003',
        date: format(today, 'yyyy-MM-dd'),
        time: '11:15 AM',
        type: 'Wellness Check',
        status: 'completed',
        ambassador: {
          name: 'Sarah Johnson',
          specialization: 'Wellness Coach',
          avatar_url: null
        },
        summary: 'Reviewed progress with stress management techniques. Patient showing good engagement with recommended practices.',
        recommendations: 'Incorporating physical activity into daily routine to help manage stress levels.'
      },
      {
        id: 'RPT-2023-004',
        date: format(addDays(today, 4), 'yyyy-MM-dd'),
        time: '3:45 PM',
        type: 'Group Session',
        status: 'upcoming',
        ambassador: {
          name: 'Dr. James Wilson',
          specialization: 'Group Therapist',
          avatar_url: null
        },
        summary: 'Scheduled for stress management group session.',
        recommendations: 'N/A'
      },
      {
        id: 'RPT-2023-005',
        date: format(addDays(today, 10), 'yyyy-MM-dd'),
        time: '1:00 PM',
        type: 'Progress Review',
        status: 'upcoming',
        ambassador: {
          name: 'Dr. Emily Chen',
          specialization: 'Clinical Psychologist',
          avatar_url: null
        },
        summary: 'Scheduled for monthly progress review.',
        recommendations: 'N/A'
      }
    ];
    
    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching appointment reports:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 