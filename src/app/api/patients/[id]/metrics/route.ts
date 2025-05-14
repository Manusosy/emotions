import { NextResponse } from 'next/server';
import { format, subDays } from 'date-fns';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';
const supabase = createClient(supabaseUrl, supabaseKey);

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
    // Get patient profile ID from user ID
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', id)
      .single();
    
    if (profileError) {
      console.error('Error finding patient profile:', profileError);
      return new NextResponse('Patient profile not found', { status: 404 });
    }
    
    // Get mood entries for this patient
    const { data: moodEntries, error: moodError } = await supabase
      .from('mood_entries')
      .select('mood_score, recorded_at')
      .eq('patient_id', patientProfile.id)
      .order('recorded_at', { ascending: false });
    
    if (moodError) {
      console.error('Error fetching mood entries:', moodError);
      return new NextResponse('Failed to retrieve mood entries', { status: 500 });
    }
    
    // Calculate metrics
    const hasEntries = moodEntries && moodEntries.length > 0;
    const firstCheckInDate = hasEntries 
      ? format(new Date(moodEntries[moodEntries.length - 1].recorded_at), 'MMM d, yyyy')
      : format(new Date(), 'MMM d, yyyy');
    
    // Calculate average mood score
    const avgMoodScore = hasEntries
      ? moodEntries.reduce((sum, entry) => sum + (entry.mood_score || 0), 0) / moodEntries.length
      : 0;
    
    // Calculate streak (consecutive days with entries)
    let streak = 0;
    if (hasEntries) {
      // Sort by date (newest first)
      const sortedEntries = [...moodEntries].sort((a, b) => 
        new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
      );
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let currentDate = today;
      
      for (const entry of sortedEntries) {
        const entryDate = new Date(entry.recorded_at);
        entryDate.setHours(0, 0, 0, 0);
        
        // Check if this entry is from the current date we're looking for
        if (entryDate.getTime() === currentDate.getTime()) {
          streak++;
          // Move to the previous day
          currentDate = new Date(currentDate);
          currentDate.setDate(currentDate.getDate() - 1);
        } else if (entryDate.getTime() < currentDate.getTime()) {
          // We missed a day, break the streak
          break;
        }
        // Skip if the entry is from a future date (shouldn't happen)
      }
    }
    
    // Build and return metrics object
    const metrics = {
      userId: id,
      moodScore: avgMoodScore,
      stressLevel: Math.max(0, 10 - avgMoodScore), // Inverse of mood score
      consistency: hasEntries ? Math.min(100, moodEntries.length * 5) : 0, // 5% per entry, max 100%
      lastCheckInStatus: hasEntries ? "Completed" : "No check-ins yet",
      streak: streak,
      firstCheckInDate: firstCheckInDate,
      trend: hasEntries && moodEntries.length > 1 ? 
        (moodEntries[0].mood_score >= moodEntries[1].mood_score ? "improving" : "declining") : 
        "stable"
    };
    
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching patient metrics:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 