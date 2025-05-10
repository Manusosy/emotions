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

  if (req.method === 'GET') {
    try {
      const reviews = await prisma.review.findMany({
        where: {
          ambassadorId: mentorId,
        },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform the data to match the frontend interface
      const transformedReviews = reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.createdAt.toISOString(),
        users: {
          full_name: review.user.name || 'Anonymous User',
          avatar_url: review.user.image || '/default-avatar.png',
        },
      }));

      return res.status(200).json(transformedReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 