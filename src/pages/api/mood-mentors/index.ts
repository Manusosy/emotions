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

  if (req.method === 'GET') {
    try {
      const mentors = await prisma.ambassador.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
          reviews: {
            select: {
              rating: true,
            },
          },
          bookings: {
            select: {
              id: true,
            },
          },
        },
      });

      // Transform the data to match the frontend interface
      const transformedMentors = mentors.map(mentor => {
        // Calculate average rating
        const ratings = mentor.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length 
          : 0;
        
        // Calculate satisfaction percentage
        const satisfaction = Math.round((avgRating / 5) * 100);

        return {
          id: mentor.id,
          name: mentor.fullName,
          credentials: 'Mental Health Professional', // This should come from a profile extension table
          specialty: 'Mental Health Support', // This should come from a profile extension table
          rating: avgRating,
          totalRatings: mentor.reviews.length,
          feedback: mentor.reviews.length,
          location: 'Remote', // This should come from a profile extension table
          isFree: true, // This should come from a profile extension table
          therapyTypes: ['Cognitive Behavioral Therapy'], // This should come from a profile extension table
          image: '/placeholder-avatar.png', // This should come from a profile extension table
          satisfaction,
        };
      });

      return res.status(200).json(transformedMentors);
    } catch (error) {
      console.error('Error fetching mood mentors:', error);
      return res.status(500).json({ error: 'Failed to fetch mood mentors' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 