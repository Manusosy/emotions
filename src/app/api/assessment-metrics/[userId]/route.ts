import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = params.userId;
    
    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const metrics = await prisma.assessmentMetrics.findUnique({
      where: { userId },
    });

    if (!metrics) {
      return new NextResponse('Metrics not found', { status: 404 });
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in GET /api/assessment-metrics/[userId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = params.userId;
    
    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const body = await request.json();
    const { stressLevel, lastAssessmentAt, streakCount, consistencyScore, trend } = body;

    const existingMetrics = await prisma.assessmentMetrics.findUnique({
      where: { userId },
    });

    if (!existingMetrics) {
      return new NextResponse('Metrics not found', { status: 404 });
    }

    const updatedMetrics = await prisma.assessmentMetrics.update({
      where: { userId },
      data: {
        stressLevel: stressLevel !== undefined ? stressLevel : existingMetrics.stressLevel,
        lastAssessmentAt: lastAssessmentAt ? new Date(lastAssessmentAt) : existingMetrics.lastAssessmentAt,
        streakCount: streakCount !== undefined ? streakCount : existingMetrics.streakCount,
        consistencyScore: consistencyScore !== undefined ? consistencyScore : existingMetrics.consistencyScore,
        trend: trend || existingMetrics.trend,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedMetrics);
  } catch (error) {
    console.error('Error in PUT /api/assessment-metrics/[userId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 