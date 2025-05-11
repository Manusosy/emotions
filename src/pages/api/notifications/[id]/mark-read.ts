import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);
  const { id } = req.query;

  if (!session?.user?.id || typeof id !== 'string') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'PUT') {
    try {
      // Verify the notification belongs to the user
      const notification = await prisma.notification.findFirst({
        where: {
          id,
          userId: session.user.id,
        },
      });

      if (!notification) {
        return res.status(404).json({ error: 'Notification not found' });
      }

      // Update the notification
      await prisma.notification.update({
        where: {
          id,
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