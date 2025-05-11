import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * A utility API route to ensure the required tables exist in Supabase
 * This should be called when initializing the app if tables need to be created
 */
export async function GET(request: Request) {
  try {
    let results = {
      stress_assessments: false,
      user_assessment_metrics: false,
      mood_entries: false
    };

    // Check/create stress_assessments table
    try {
      // First check if the table exists
      const { error: checkError } = await supabase.from('stress_assessments').select('count(*)', { count: 'exact', head: true });
      
      if (checkError && checkError.message.includes('does not exist')) {
        // Create the table
        const { error: createError } = await supabase.rpc('create_stress_assessments_table');
        
        if (createError) {
          console.error('Error creating stress_assessments table:', createError);
        } else {
          results.stress_assessments = true;
        }
      } else {
        results.stress_assessments = true;
      }
    } catch (err) {
      console.error('Error with stress_assessments table:', err);
    }

    // Check/create user_assessment_metrics table
    try {
      const { error: checkError } = await supabase.from('user_assessment_metrics').select('count(*)', { count: 'exact', head: true });
      
      if (checkError && checkError.message.includes('does not exist')) {
        // Create the table
        const { error: createError } = await supabase.rpc('create_metrics_table');
        
        if (createError) {
          console.error('Error creating user_assessment_metrics table:', createError);
        } else {
          results.user_assessment_metrics = true;
        }
      } else {
        results.user_assessment_metrics = true;
      }
    } catch (err) {
      console.error('Error with user_assessment_metrics table:', err);
    }

    // Check/create mood_entries table
    try {
      const { error: checkError } = await supabase.from('mood_entries').select('count(*)', { count: 'exact', head: true });
      
      if (checkError && checkError.message.includes('does not exist')) {
        // Create the table
        const { error: createError } = await supabase.rpc('create_mood_entries_table');
        
        if (createError) {
          console.error('Error creating mood_entries table:', createError);
        } else {
          results.mood_entries = true;
        }
      } else {
        results.mood_entries = true;
      }
    } catch (err) {
      console.error('Error with mood_entries table:', err);
    }

    return NextResponse.json({
      success: true,
      message: 'Table check complete',
      results
    });
  } catch (error) {
    console.error('Error in table check/creation:', error);
    return NextResponse.json({
      success: false,
      message: 'Error checking/creating tables',
      error: String(error)
    }, { status: 500 });
  }
} 