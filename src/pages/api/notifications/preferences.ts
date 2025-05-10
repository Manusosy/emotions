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
      const preferences = await prisma.userPreferences.findUnique({
        where: {
          userId: session.user.id,
        },
        select: {
          notificationPreferences: true,
        },
      });

      // Return default preferences if none exist
      if (!preferences?.notificationPreferences) {
        return res.status(200).json({
          emailNotifications: true,
          appointmentReminders: true,
          patientUpdates: true,
          groupNotifications: true,
          marketingCommunications: false,
        });
      }

      return res.status(200).json(preferences.notificationPreferences);
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return res.status(500).json({ error: 'Failed to fetch notification preferences' });
    }
  }

  if (req.method === 'PUT') {
    try {
      const preferences = req.body;

      // Validate preferences
      if (
        typeof preferences.emailNotifications !== 'boolean' ||
        typeof preferences.appointmentReminders !== 'boolean' ||
        typeof preferences.patientUpdates !== 'boolean' ||
        typeof preferences.groupNotifications !== 'boolean' ||
        typeof preferences.marketingCommunications !== 'boolean'
      ) {
        return res.status(400).json({ error: 'Invalid preferences format' });
      }

      // Update or create preferences
      await prisma.userPreferences.upsert({
        where: {
          userId: session.user.id,
        },
        update: {
          notificationPreferences: preferences,
          updatedAt: new Date(),
        },
        create: {
          userId: session.user.id,
          notificationPreferences: preferences,
        },
      });

      return res.status(200).json({ message: 'Preferences updated successfully' });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return res.status(500).json({ error: 'Failed to update notification preferences' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 