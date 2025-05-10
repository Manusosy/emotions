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

    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const assessments = await prisma.stressAssessment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error in GET /api/stress-assessments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await request.json();
    const { userId, score, symptoms, triggers, notes } = body;

    const assessment = await prisma.stressAssessment.create({
      data: {
        userId,
        score,
        symptoms,
        triggers,
        notes,
      },
    });

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error in POST /api/stress-assessments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 