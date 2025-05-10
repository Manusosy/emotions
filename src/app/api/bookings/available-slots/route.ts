import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Define available time slots (9 AM to 5 PM)
const AVAILABLE_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ambassadorId = searchParams.get('ambassadorId');
    const date = searchParams.get('date');

    if (!ambassadorId || !date) {
      return new NextResponse('Missing required parameters', { status: 400 });
    }

    // Get all bookings for the ambassador on the specified date
    const bookings = await prisma.booking.findMany({
      where: {
        ambassadorId,
        date: new Date(date),
        status: {
          not: 'CANCELLED'
        },
      },
      select: {
        time: true,
      },
    });

    // Get booked time slots
    const bookedSlots = bookings.map(booking => booking.time);

    // Filter out booked slots from available slots
    const availableSlots = AVAILABLE_SLOTS.filter(slot => !bookedSlots.includes(slot));

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Error in GET /api/bookings/available-slots:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 