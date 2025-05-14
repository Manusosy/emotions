import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * GET /api/patients/[id]/journal-entries
 * Retrieve journal entries for a patient
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
    
    // Get the journal entries for this patient
    const { data: journalEntries, error: entriesError } = await supabase
      .from('journal_entries')
      .select('id, title, content, mood_rating, tags, created_at, updated_at')
      .eq('patient_id', patientProfile.id)
      .order('created_at', { ascending: false });
    
    if (entriesError) {
      console.error('Error fetching journal entries:', entriesError);
      return new NextResponse('Failed to fetch journal entries', { status: 500 });
    }
    
    // Format the journal entries
    const formattedEntries = journalEntries.map(entry => {
      // Map mood rating to a descriptive mood
      let mood = 'Neutral';
      if (entry.mood_rating) {
        if (entry.mood_rating >= 8) mood = 'Happy';
        else if (entry.mood_rating >= 6) mood = 'Content';
        else if (entry.mood_rating >= 4) mood = 'Neutral';
        else if (entry.mood_rating >= 2) mood = 'Sad';
        else mood = 'Depressed';
      }
      
      return {
        id: entry.id,
        user_id: id,
        title: entry.title,
        content: entry.content,
        mood: mood,
        tags: entry.tags || [],
        created_at: entry.created_at,
        updated_at: entry.updated_at
      };
    });
    
    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 