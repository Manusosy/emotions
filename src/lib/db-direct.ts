/**
 * Direct database utility for handling assessment data
 * This utility provides a more direct approach to saving assessment data
 * when the API might be experiencing issues.
 */

import { CreateStressAssessmentData } from "@/types/stress-assessment.types";
import supabaseClient from "@/lib/supabase";

/**
 * Save a stress assessment directly to the database
 * Using Supabase client
 * 
 * @param assessmentData The assessment data to save
 * @returns A promise that resolves with the saved assessment
 */
export async function saveStressAssessment(assessmentData: CreateStressAssessmentData): Promise<any> {
  try {
    console.log("Direct utility: Saving assessment...");
    
    // Validate required fields
    if (!assessmentData.userId) {
      throw new Error("User ID is required");
    }
    
    if (assessmentData.score === undefined || assessmentData.score === null) {
      throw new Error("Score is required");
    }
    
    // Format the assessment data properly with strict type checking
    const formattedData = {
      userId: assessmentData.userId,
      score: parseFloat(assessmentData.score.toString()), // Ensure it's a proper number
      symptoms: Array.isArray(assessmentData.symptoms) ? assessmentData.symptoms : [],
      triggers: Array.isArray(assessmentData.triggers) ? assessmentData.triggers : [],
      notes: assessmentData.notes || "",
      responses: assessmentData.responses || null
    };

    console.log("Formatted data:", formattedData);
    
    try {
      // Try using Supabase client directly first
      try {
        const savedAssessment = await supabaseClient.saveStressAssessment(formattedData);
        
        if (!savedAssessment) {
          throw new Error("No data returned from Supabase");
        }
        
        console.log("Assessment saved directly to Supabase:", savedAssessment);
        return { success: true, data: savedAssessment };
      } catch (supabaseError: any) {
        console.error('Error in Supabase operation, trying API directly:', supabaseError);
        
        // If Supabase client fails, try the API directly
        const response = await fetch('/api/stress-assessments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
          },
          body: JSON.stringify(formattedData)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API error: ${response.status} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Unknown error saving assessment');
        }
        
        console.log("Assessment saved via API:", result);
        return { success: true, data: result.assessment };
      }
    } catch (apiError: any) {
      console.error('All save attempts failed:', apiError);
      throw new Error(apiError.message || "Database operation failed");
    }
  } catch (error: any) {
    console.error('Error in direct database utility:', error);
    // Provide a more specific error message if available
    return { 
      success: false, 
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Save a mood entry directly to the database
 * Using Supabase client
 * 
 * @param moodData The mood entry data to save
 * @returns A promise that resolves with the saved mood entry
 */
export async function saveMoodEntry(moodData: any): Promise<any> {
  try {
    console.log("Direct utility: Saving mood entry...");
    
    // Validate required fields
    if (!moodData.user_id) {
      throw new Error("User ID is required");
    }
    
    if (moodData.mood_score === undefined || moodData.mood_score === null) {
      throw new Error("Mood score is required");
    }
    
    // Format the mood data properly to match database field names
    const formattedData = {
      patient_id: moodData.user_id, // Map user_id to patient_id
      mood_score: parseFloat(moodData.mood_score.toString()),
      mood_description: moodData.mood_description || moodData.selectedEmotion || "",
      assessment_result: moodData.assessment_result || "",
      factors: moodData.factors || [],
      notes: moodData.notes || "",
      recorded_at: new Date().toISOString() // Use recorded_at instead of created_at
    };

    console.log("Formatted mood data:", formattedData);
    
    try {
      // Use Supabase client's saveMoodEntry function
      const savedMoodEntry = await supabaseClient.saveMoodEntry(formattedData);
      
      if (!savedMoodEntry) {
        throw new Error("No data returned from Supabase");
      }
      
      console.log("Mood entry saved directly to Supabase:", savedMoodEntry);
      return { success: true, data: savedMoodEntry };
    } catch (supabaseError: any) {
      console.error('Error in Supabase mood entry operation:', supabaseError);
      throw new Error(supabaseError.message || "Database operation failed");
    }
  } catch (error: any) {
    console.error('Error in mood entry utility:', error);
    // Provide a more specific error message if available
    throw new Error(error.message || "Unknown error");
  }
} 