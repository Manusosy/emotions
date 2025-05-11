import { NextResponse } from 'next/server';
import supabaseClient from '@/lib/supabase';

/**
 * Get stress assessments for a user
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    
    if (!userId) {
      return new NextResponse('Missing userId', { status: 400 });
    }

    const assessments = await supabaseClient.getStressAssessments(userId, limit);
    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error in GET /api/stress-assessments:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

/**
 * Save a new stress assessment 
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    
    // Basic validation
    if (!body.userId || typeof body.score !== 'number') {
      console.log("Invalid data:", { userId: body.userId, scoreType: typeof body.score });
      return new NextResponse('Missing or invalid required fields', { status: 400 });
    }
    
    console.log("Saving assessment for user:", body.userId);
    
    try {
      // Save assessment using Supabase
      const savedAssessment = await supabaseClient.saveStressAssessment({
        userId: body.userId,
        score: body.score,
        symptoms: body.symptoms || [],
        triggers: body.triggers || [],
        notes: body.notes || "",
        responses: body.responses || null
      });
      
      console.log("Assessment saved successfully:", savedAssessment);
      return NextResponse.json({ success: true, data: savedAssessment });
    } catch (dbError: any) {
      console.error("Database error:", dbError);
      return new NextResponse(`Database error: ${dbError.message}`, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in POST /api/stress-assessments:', error);
    return new NextResponse(`Internal Server Error: ${error.message}`, { status: 500 });
  }
} 