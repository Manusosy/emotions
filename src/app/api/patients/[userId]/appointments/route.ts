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

    // For now, return mock data since we're focusing on stress assessment
    const mockAppointments = [
      {
        id: '1',
        date: '2023-11-15',
        time: '10:00 AM',
        type: 'video',
        status: 'upcoming',
        ambassador: {
          name: 'Dr. Sarah Johnson',
          specialization: 'Mental Health Counselor'
        },
        notes: 'Initial consultation'
      },
      {
        id: '2',
        date: '2023-11-08',
        time: '2:30 PM',
        type: 'in-person',
        status: 'completed',
        ambassador: {
          name: 'Dr. Michael Chen',
          specialization: 'Psychiatrist'
        },
        notes: 'Follow-up appointment'
      }
    ];

    return NextResponse.json(mockAppointments);
  } catch (error) {
    console.error('Error in GET /api/patients/[userId]/appointments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 