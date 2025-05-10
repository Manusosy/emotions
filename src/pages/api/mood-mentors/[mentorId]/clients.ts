import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { format } from 'date-fns';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { mentorId } = req.query;

  if (!session?.user?.id || typeof mentorId !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the mentor is requesting their own clients
  if (session.user.id !== mentorId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      const bookings = await prisma.booking.findMany({
        where: {
          ambassadorId: mentorId,
        },
        select: {
          id: true,
          sessionDate: true,
          status: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              bookings: {
                where: {
                  ambassadorId: mentorId,
                },
                select: {
                  id: true,
                  sessionDate: true,
                },
                orderBy: {
                  sessionDate: 'desc',
                },
              },
            },
          },
        },
        orderBy: {
          sessionDate: 'desc',
        },
      });

      // Group bookings by user and transform into client list
      const clientMap = new Map();
      
      bookings.forEach(booking => {
        const user = booking.user;
        if (!clientMap.has(user.id)) {
          const userBookings = user.bookings;
          const lastSession = userBookings[0]?.sessionDate;
          const nextSession = userBookings.find(b => 
            new Date(b.sessionDate) > new Date() && b.status !== 'cancelled'
          )?.sessionDate;

          clientMap.set(user.id, {
            id: user.id,
            full_name: user.name,
            email: user.email,
            avatar_url: '', // This should come from a profile extension
            phone_number: '', // This should come from a profile extension
            last_session: lastSession ? format(new Date(lastSession), 'yyyy-MM-dd') : null,
            total_sessions: userBookings.length,
            status: userBookings.some(b => 
              new Date(b.sessionDate) > new Date() && b.status === 'confirmed'
            ) ? 'active' : 'inactive',
            last_appointment: lastSession ? format(new Date(lastSession), 'MMM dd, yyyy') : null,
            next_appointment: nextSession ? format(new Date(nextSession), 'MMM dd, yyyy') : null,
          });
        }
      });

      return res.status(200).json(Array.from(clientMap.values()));
    } catch (error) {
      console.error('Error fetching clients:', error);
      return res.status(500).json({ error: 'Failed to fetch clients' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 