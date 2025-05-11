import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = params.userId;
    
    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    // Mock data for appointment reports
    const appointmentReports = [
      {
        id: '1',
        appointmentId: '2',
        date: '2023-11-08',
        doctor: 'Dr. Michael Chen',
        title: 'Follow-up Consultation',
        summary: 'Patient reports improved sleep patterns since last visit. Continuing with current treatment plan and adding daily mindfulness exercises.',
        recommendations: [
          'Continue current medication regimen',
          'Practice 15 minutes of mindfulness daily',
          'Maintain sleep hygiene routine'
        ],
        stressLevel: 5.2
      }
    ];

    return NextResponse.json(appointmentReports);
  } catch (error) {
    console.error('Error in GET /api/patients/[userId]/appointment-reports:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 