/**
 * Patient Service
 * 
 * Handles operations related to patients, including:
 * - Patient profile data
 * - Health metrics
 * - Appointment reports
 * - Health records
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../client';
import { format } from 'date-fns';

/**
 * Patient service for handling patient-related operations
 */
class PatientService {
  /**
   * Gets appointment reports for a patient
   * @param patientId The ID of the patient
   * @param filter Optional filter (all, upcoming, completed, cancelled)
   * @returns Promise with the appointment reports and success/error status
   */
  async getAppointmentReports(patientId: string, filter: string = 'all') {
    try {
      console.log(`Getting appointment reports for patient: ${patientId}, filter: ${filter}`);
      
      // Get patient profile ID from user ID
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', patientId)
        .single();
      
      if (profileError || !patientProfile) {
        console.error('Error finding patient profile:', profileError);
        return { 
          success: false,
          data: null,
          error: 'Patient profile not found'
        };
      }
      
      // Build the query based on filter
      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          notes,
          meeting_link,
          mentor_profiles:mood_mentor_profiles(
            id,
            user_id,
            users(
              full_name,
              avatar_url
            ),
            specialties,
            education
          )
        `)
        .eq('patient_id', patientProfile.id);
      
      // Apply filter
      if (filter === 'upcoming') {
        query = query.gte('start_time', new Date().toISOString()).eq('status', 'scheduled');
      } else if (filter === 'completed') {
        query = query.eq('status', 'completed');
      } else if (filter === 'cancelled') {
        query = query.eq('status', 'cancelled');
      }
      
      // Execute query
      const { data: appointments, error } = await query.order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching appointments:', error);
        return { 
          success: false,
          data: null,
          error: 'Failed to retrieve appointment reports'
        };
      }
      
      // Transform data to match the expected format
      const formattedAppointments = appointments.map(appointment => {
        const startTime = new Date(appointment.start_time);
        const mentor = appointment.mentor_profiles || {};
        const user = mentor.users ? mentor.users[0] : {};
        
        return {
          id: appointment.id,
          date: format(startTime, 'dd MMM yyyy'),
          time: format(startTime, 'h:mm a'),
          type: appointment.meeting_link ? 'Video Consultation' : 'In-person',
          status: appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1),
          ambassador: {
            name: user?.full_name || 'Unknown',
            specialization: Array.isArray(mentor.specialties) && mentor.specialties.length > 0 
              ? mentor.specialties[0] 
              : 'Mood Mentor'
          },
          notes: appointment.notes || ''
        };
      });
      
      return { 
        success: true,
        data: formattedAppointments,
        error: null
      };
    } catch (error) {
      console.error('Error getting appointment reports:', error);
      return { 
        success: false,
        data: null,
        error: 'Failed to retrieve appointment reports'
      };
    }
  }
  
  /**
   * Gets a patient's profile data
   * @param patientId The ID of the patient
   * @returns Promise with the patient profile and success/error status
   */
  async getPatientProfile(patientId: string) {
    try {
      console.log(`Getting profile for patient: ${patientId}`);
      
      // Get user information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, full_name, phone_number, avatar_url, created_at')
        .eq('id', patientId)
        .single();
      
      if (userError || !userData) {
        console.error('Error fetching user data:', userError);
        return { 
          success: false,
          data: null,
          error: 'User not found'
        };
      }
      
      // Get patient profile data
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id, date_of_birth, gender, emergency_contact, medical_conditions, preferences')
        .eq('user_id', patientId)
        .single();
      
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching patient profile:', profileError);
        return { 
          success: false,
          data: null,
          error: 'Failed to retrieve patient profile'
        };
      }
      
      // Combine user and profile data
      const nameParts = userData.full_name?.split(' ') || ['', ''];
      const profile = {
        id: userData.id,
        patient_id: `EMHA-${userData.id.substring(0, 4)}`,
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        email: userData.email,
        phone_number: userData.phone_number || '',
        date_of_birth: profileData?.date_of_birth || null,
        country: profileData?.preferences?.country || 'United States',
        address: profileData?.preferences?.address || '',
        city: profileData?.preferences?.city || '',
        state: profileData?.preferences?.state || '',
        pincode: profileData?.preferences?.pincode || '',
        avatar_url: userData.avatar_url || '',
        created_at: userData.created_at
      };
      
      return { 
        success: true,
        data: profile,
        error: null
      };
    } catch (error) {
      console.error('Error getting patient profile:', error);
      return { 
        success: false,
        data: null,
        error: 'Failed to retrieve patient profile'
      };
    }
  }
  
  /**
   * Gets a patient's health metrics
   * @param patientId The ID of the patient
   * @returns Promise with the health metrics and success/error status
   */
  async getHealthMetrics(patientId: string) {
    try {
      console.log(`Getting health metrics for patient: ${patientId}`);
      
      // Get patient profile ID from user ID
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', patientId)
        .single();
      
      if (profileError || !patientProfile) {
        console.error('Error finding patient profile:', profileError);
        return { 
          success: false,
          data: null,
          error: 'Patient profile not found'
        };
      }
      
      // Get mood entries for this patient
      const { data: moodEntries, error: moodError } = await supabase
        .from('mood_entries')
        .select('mood_score, recorded_at')
        .eq('patient_id', patientProfile.id)
        .order('recorded_at', { ascending: false });
      
      if (moodError) {
        console.error('Error fetching mood entries:', moodError);
        return { 
          success: false,
          data: null,
          error: 'Failed to retrieve mood entries'
        };
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
      
      return { 
        success: true,
        data: {
          moodScore: avgMoodScore || 0,
          stressLevel: Math.max(0, 10 - avgMoodScore) || 0, // Inverse of mood score
          consistency: hasEntries ? Math.min(100, moodEntries.length * 5) : 0, // 5% per entry, max 100%
          lastCheckInStatus: hasEntries ? "Completed" : "No check-ins yet",
          streak: streak,
          firstCheckInDate: firstCheckInDate,
          trend: hasEntries && moodEntries.length > 1 ? 
            (moodEntries[0].mood_score >= moodEntries[1].mood_score ? "improving" : "declining") : 
            "stable"
        },
        error: null
      };
    } catch (error) {
      console.error('Error getting health metrics:', error);
      return { 
        success: false,
        data: null,
        error: 'Failed to retrieve health metrics'
      };
    }
  }
}

export default new PatientService(); 