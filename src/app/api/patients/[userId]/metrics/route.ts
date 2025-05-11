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

    // Default metrics
    let metrics = {
      moodScore: 7.0, // Default average mood
      stressLevel: 5.0,
      consistency: 0,
      lastCheckInStatus: "No check-ins yet",
      streak: 0,
      firstCheckInDate: ""
    };

    // Try to get the latest stress assessment
    try {
      const stressAssessments = await prisma.$queryRaw`
        SELECT id, "userId", score, "createdAt" 
        FROM "StressAssessment" 
        WHERE "userId" = ${userId} 
        ORDER BY "createdAt" DESC 
        LIMIT 1
      `;

      // If we have assessments, update the metrics
      if (Array.isArray(stressAssessments) && stressAssessments.length > 0) {
        const lastAssessment = stressAssessments[0];
        metrics.stressLevel = lastAssessment.score;
        
        // Calculate days since last assessment
        const lastAssessmentDate = new Date(lastAssessment.createdAt);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - lastAssessmentDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff === 0) {
          metrics.lastCheckInStatus = "Today";
        } else if (daysDiff === 1) {
          metrics.lastCheckInStatus = "Yesterday";
        } else {
          metrics.lastCheckInStatus = `${daysDiff} days ago`;
        }
      }

      // Try to get assessment metrics
      const assessmentMetrics = await prisma.$queryRaw`
        SELECT "userId", "stressLevel", "streakCount", "consistencyScore", "firstCheckInDate"
        FROM "AssessmentMetrics"
        WHERE "userId" = ${userId}
        LIMIT 1
      `;

      if (Array.isArray(assessmentMetrics) && assessmentMetrics.length > 0) {
        const userMetrics = assessmentMetrics[0];
        metrics.streak = userMetrics.streakCount || 0;
        metrics.consistency = userMetrics.consistencyScore || 0;
        
        if (userMetrics.firstCheckInDate) {
          metrics.firstCheckInDate = new Date(userMetrics.firstCheckInDate).toLocaleDateString();
        }
      }
    } catch (dbError) {
      console.error('Database error when fetching metrics:', dbError);
      // We'll just use the default metrics in case of error
    }

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error in GET /api/patients/[userId]/metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 