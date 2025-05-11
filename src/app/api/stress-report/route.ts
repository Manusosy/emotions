import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const whereClause: any = {
      userId,
    };

    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) {
        whereClause.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.createdAt.lte = new Date(endDate);
      }
    }

    const assessments = await prisma.stressAssessment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    if (assessments.length === 0) {
      return NextResponse.json({
        averageScore: 0,
        totalAssessments: 0,
        commonSymptoms: [],
        commonTriggers: [],
      });
    }

    // Calculate average score
    const averageScore = assessments.reduce((acc, curr) => acc + curr.score, 0) / assessments.length;

    // Count symptoms and triggers
    const symptomCounts: Record<string, number> = {};
    const triggerCounts: Record<string, number> = {};

    assessments.forEach(assessment => {
      assessment.symptoms.forEach(symptom => {
        symptomCounts[symptom] = (symptomCounts[symptom] || 0) + 1;
      });
      assessment.triggers.forEach(trigger => {
        triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
      });
    });

    // Get top 5 most common symptoms and triggers
    const commonSymptoms = Object.entries(symptomCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([symptom]) => symptom);

    const commonTriggers = Object.entries(triggerCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([trigger]) => trigger);

    return NextResponse.json({
      averageScore,
      totalAssessments: assessments.length,
      commonSymptoms,
      commonTriggers,
    });
  } catch (error) {
    console.error('Error in GET /api/stress-report:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 