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

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Return a formatted profile
    const profile = {
      id: user.id,
      first_name: user.name?.split(' ')[0] || 'User',
      last_name: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email,
      patient_id: user.id.slice(0, 8).toUpperCase(),
      image: user.image,
      // Add other profile fields as needed
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in GET /api/patients/[userId]/profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
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

    const body = await request.json();
    
    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: `${body.first_name || ''} ${body.last_name || ''}`.trim(),
        // Add other updatable fields as needed
      }
    });

    // Return the updated profile
    const profile = {
      id: updatedUser.id,
      first_name: updatedUser.name?.split(' ')[0] || 'User',
      last_name: updatedUser.name?.split(' ').slice(1).join(' ') || '',
      email: updatedUser.email,
      patient_id: updatedUser.id.slice(0, 8).toUpperCase(),
      image: updatedUser.image,
      // Add other profile fields as needed
    };

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error in PUT /api/patients/[userId]/profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 