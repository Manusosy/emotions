import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          userId: session.user.id,
        },
        orderBy: {
          sessionDate: 'desc',
        },
        include: {
          ambassador: {
            select: {
              id: true,
              fullName: true,
            },
          },
          reviews: {
            where: {
              userId: session.user.id,
            },
            select: {
              id: true,
            },
          },
        },
      });

      // Transform the data to match the frontend interface
      const transformedBookings = bookings.map((booking) => ({
        id: booking.id,
        session_date: booking.sessionDate.toISOString().split('T')[0],
        session_time: booking.sessionTime,
        status: booking.status,
        notes: booking.notes || '',
        ambassador: {
          id: booking.ambassador.id,
          full_name: booking.ambassador.fullName,
        },
        has_review: booking.reviews.length > 0,
      }));

      return res.status(200).json(transformedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 