import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { 
      userId, 
      stressLevel, 
      lastAssessmentAt, 
      streakCount, 
      consistencyScore, 
      trend,
      firstCheckInDate
    } = body;

    if (!userId || stressLevel === undefined) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if metrics already exist for this user
    const existingMetrics = await prisma.assessmentMetrics.findUnique({
      where: { userId },
    });

    if (existingMetrics) {
      return new NextResponse('Metrics already exist for this user', { status: 409 });
    }

    const now = new Date();
    
    const metrics = await prisma.assessmentMetrics.create({
      data: {
        userId,
        stressLevel: stressLevel,
        lastAssessmentAt: lastAssessmentAt ? new Date(lastAssessmentAt) : now,
        streakCount: streakCount || 1,
        consistencyScore: consistencyScore || 0,
        trend: trend || 'stable',
        firstCheckInDate: firstCheckInDate ? new Date(firstCheckInDate) : now,
        updatedAt: now,
      },
    });

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in POST /api/assessment-metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 