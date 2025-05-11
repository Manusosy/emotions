import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';

// Mock metrics data with some realistic values
const getMockMetricsData = (patientId: string) => {
  // Create a date from last week for the first check-in
  const firstCheckInDate = format(subDays(new Date(), 7), 'MMM d, yyyy');
  
  return {
    userId: patientId,
    moodScore: 7.2, // Scale of 1-10
    stressLevel: 3.5, // Scale of 1-10 
    consistency: 85, // Percentage
    lastCheckInStatus: "Completed today",
    streak: 5, // Days
    firstCheckInDate: firstCheckInDate,
    trend: "improving"
  };
};

/**
 * GET /api/patients/[id]/metrics
 * Retrieve metrics for a patient
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  try {
    // Get mock metrics for this patient
    const metrics = getMockMetricsData(id);
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching patient metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 