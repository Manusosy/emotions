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

  const { notificationId } = req.query;

  if (typeof notificationId !== 'string') {
    return res.status(400).json({ error: 'Invalid notification ID' });
  }

  if (req.method === 'PUT') {
    try {
      const notification = await prisma.notification.findUnique({
        where: {
          id: notificationId,
          userId: session.user.id,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      await prisma.notification.update({
        where: {
          id: notificationId,
        },
        data: {
          read: true,
          updatedAt: new Date(),
        },
      });

      return res.status(200).json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 