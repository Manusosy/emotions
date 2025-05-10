import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { differenceInDays, parseISO } from 'date-fns';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const moodEntries = await prisma.moodEntry.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (moodEntries.length === 0) {
      return NextResponse.json({
        totalEntries: 0,
        averageScore: 0,
        lastAssessment: null,
        mostFrequentMood: 'No data',
        streakDays: 0,
      });
    }

    // Calculate average score
    const averageScore = moodEntries.reduce((acc, entry) => acc + entry.score, 0) / moodEntries.length;

    // Get last assessment
    const lastAssessment = moodEntries[0].createdAt.toISOString();

    // Calculate streak
    let streakDays = 0;
    const sortedEntries = [...moodEntries].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );

    const latestDate = sortedEntries[0].createdAt;
    const today = new Date();
    const daysDifference = differenceInDays(today, latestDate);

    if (daysDifference <= 1) {
      streakDays = 1;
      let previousDate = latestDate;

      for (let i = 1; i < sortedEntries.length; i++) {
        const currentDate = sortedEntries[i].createdAt;
        if (differenceInDays(previousDate, currentDate) === 1) {
          streakDays++;
          previousDate = currentDate;
        } else {
          break;
        }
      }
    }

    // Count mood frequencies
    const moodFrequencies = moodEntries.reduce((acc, entry) => {
      const key = entry.mood || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Find most frequent mood
    const mostFrequentMood = Object.entries(moodFrequencies)
      .sort(([,a], [,b]) => b - a)[0][0];

    return NextResponse.json({
      totalEntries: moodEntries.length,
      averageScore,
      lastAssessment,
      mostFrequentMood,
      streakDays,
    });
  } catch (error) {
    console.error('Error in GET /api/mood-summary:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 