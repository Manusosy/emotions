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
      const { ambassadorId, bookingId, rating, comment } = req.body;

      // Validate required fields
      if (!ambassadorId || !bookingId || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the booking exists and belongs to the user
      const booking = await prisma.booking.findUnique({
        where: {
          id: bookingId,
          userId: session.user.id,
          ambassadorId,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          userId: session.user.id,
          ambassadorId,
          bookingId,
          rating,
          comment,
        },
      });

      return res.status(201).json(review);
    } catch (error) {
      console.error('Error creating review:', error);
      return res.status(500).json({ error: 'Failed to create review' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 