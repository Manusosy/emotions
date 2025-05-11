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
    const mockMessages = [
      {
        id: '1',
        sender: 'Dr. Sarah Johnson',
        senderAvatar: '/avatars/doctor1.png',
        content: 'Hello! I wanted to check in after our last session. How are you feeling?',
        timestamp: new Date().toISOString(),
        read: false
      },
      {
        id: '2',
        sender: 'Support Team',
        senderAvatar: '/avatars/support.png',
        content: 'Your next appointment has been confirmed for Friday at 3:00 PM.',
        timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        read: true
      }
    ];

    return NextResponse.json(mockMessages);
  } catch (error) {
    console.error('Error in GET /api/patients/[userId]/messages:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 