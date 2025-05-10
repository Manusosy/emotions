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
      const notifications = await prisma.notification.findMany({
        where: {
          userId: session.user.id,
          userType: 'ambassador',
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Transform to match frontend interface
      const transformedNotifications = notifications.map(notification => ({
        id: notification.id,
        type: notification.type,
        content: notification.content,
        timestamp: notification.createdAt.toISOString(),
        read: notification.read,
        avatar: notification.avatar,
        senderName: notification.senderName,
        title: notification.title,
        created_at: notification.createdAt.toISOString(),
        user_id: notification.userId,
      }));

      return res.status(200).json(transformedNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 