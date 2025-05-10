import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { mentorId } = req.query;

  if (!session?.user?.id || typeof mentorId !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Verify the mentor is requesting their own stats
  if (session.user.id !== mentorId) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'GET') {
    try {
      // Get all bookings for this mentor
      const bookings = await prisma.booking.findMany({
        where: {
          ambassadorId: mentorId,
        },
        select: {
          id: true,
          userId: true,
          sessionDate: true,
          status: true,
        },
      });

      // Get all reviews for this mentor
      const reviews = await prisma.review.findMany({
        where: {
          ambassadorId: mentorId,
        },
        select: {
          rating: true,
        },
      });

      // Get all support groups for this mentor
      const groups = await prisma.supportGroup.findMany({
        where: {
          mentorId,
        },
      });

      // Calculate stats
      const uniquePatients = new Set(bookings.map(b => b.userId)).size;
      const upcomingAppointments = bookings.filter(b => 
        new Date(b.sessionDate) > new Date() && 
        b.status === 'confirmed'
      ).length;
      const ratings = reviews.map(r => r.rating);
      const avgRating = ratings.length > 0 
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
        : 0;
      const ratingPercentage = Math.round((avgRating / 5) * 100);

      return res.status(200).json({
        patientsCount: uniquePatients,
        appointmentsCount: upcomingAppointments,
        groupsCount: groups.length,
        ratingPercentage,
        reviewsCount: reviews.length,
      });
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      return res.status(500).json({ error: 'Failed to fetch mentor stats' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 