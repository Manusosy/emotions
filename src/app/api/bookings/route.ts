import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId },
      include: {
        ambassador: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        review: true,
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Error in GET /api/bookings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { userId, ambassadorId, date, time, notes } = body;

    const booking = await prisma.booking.create({
      data: {
        userId,
        ambassadorId,
        date: new Date(date),
        time,
        notes,
      },
      include: {
        ambassador: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error('Error in POST /api/bookings:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 