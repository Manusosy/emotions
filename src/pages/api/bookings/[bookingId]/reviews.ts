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

  const { bookingId } = req.query;
  
  if (typeof bookingId !== 'string') {
    return res.status(400).json({ error: 'Invalid booking ID' });
  }

  if (req.method === 'POST') {
    try {
      const { ambassador_id, rating, comment } = req.body;

      if (!ambassador_id || !rating || !comment) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Verify the booking belongs to the user
      const booking = await prisma.booking.findUnique({
        where: {
          id: bookingId,
          userId: session.user.id,
        },
      });

      if (!booking) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      if (booking.status !== 'completed') {
        return res.status(400).json({ error: 'Cannot review uncompleted booking' });
      }

      // Check if review already exists
      const existingReview = await prisma.review.findFirst({
        where: {
          bookingId,
          userId: session.user.id,
        },
      });

      if (existingReview) {
        return res.status(400).json({ error: 'Review already exists' });
      }

      // Create the review
      const review = await prisma.review.create({
        data: {
          bookingId,
          userId: session.user.id,
          ambassadorId: ambassador_id,
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