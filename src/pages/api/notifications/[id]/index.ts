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

  if (req.method === 'DELETE') {
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

      // Delete the notification
      await prisma.notification.delete({
        where: {
          id,
        },
      });

      return res.status(200).json({ message: 'Notification deleted successfully' });
    } catch (error) {
      console.error('Error deleting notification:', error);
      return res.status(500).json({ error: 'Failed to delete notification' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 