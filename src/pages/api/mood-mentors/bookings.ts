import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    try {
      const { ambassadorId, sessionDate, sessionTime, notes } = req.body;

      // Validate required fields
      if (!ambassadorId || !sessionDate || !sessionTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the ambassador exists
      const ambassador = await prisma.ambassador.findUnique({
        where: {
          id: ambassadorId,
        },
      });

      if (!ambassador) {
        return res.status(404).json({ error: 'Ambassador not found' });
      }

      // Check if the time slot is available
      const existingBooking = await prisma.booking.findFirst({
        where: {
          ambassadorId,
          sessionDate: new Date(sessionDate),
          sessionTime,
          status: {
            in: ['pending', 'confirmed'],
          },
        },
      });

      if (existingBooking) {
        return res.status(409).json({ error: 'Time slot is already booked' });
      }

      // Create the booking
      const booking = await prisma.booking.create({
        data: {
          userId: session.user.id,
          ambassadorId,
          sessionDate: new Date(sessionDate),
          sessionTime,
          notes: notes || '',
          status: 'pending',
        },
      });

      return res.status(201).json(booking);
    } catch (error) {
      console.error('Error creating booking:', error);
      return res.status(500).json({ error: 'Failed to create booking' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 