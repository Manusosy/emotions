/**
 * Appointment Service
 * 
 * Handles operations related to appointments, including:
 * - Creating new appointments
 * - Updating appointment status
 * - Fetching appointments based on various criteria
 * - Handling appointment cancellations
 */

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../client';
import { errorLog } from '@/utils/environment';

interface MentorProfile {
  id?: string;
  user_id?: string;
  users?: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  }>;
}

interface PatientProfile {
  id?: string;
  user_id?: string;
  users?: Array<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  }>;
}

interface AppointmentData {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  meeting_link: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  mentor_profiles?: MentorProfile;
  patient_profiles?: PatientProfile;
}

/**
 * Appointment service for handling appointment-related operations
 */
class AppointmentService {
  /**
   * Gets appointments for a patient
   * @param patientId The ID of the patient
   * @param status Optional status filter (upcoming, completed, cancelled)
   * @returns Promise with the appointments and any error
   */
  async getPatientAppointments(patientId: string, status?: string) {
    try {
      console.log(`Getting appointments for patient: ${patientId}, status: ${status || 'all'}`);
      
      // Get patient profile ID from user ID
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', patientId)
        .single();
      
      if (profileError) {
        errorLog('Error finding patient profile:', profileError);
        return { data: null, error: 'Patient profile not found' };
      }
      
      // Build query for appointments
      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          meeting_link,
          notes,
          created_at,
          updated_at,
          mentor_profiles:mood_mentor_profiles(
            id,
            user_id,
            users(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('patient_id', patientProfile.id);
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Execute query
      const { data: appointments, error } = await query.order('start_time', { ascending: true });
      
      if (error) {
        errorLog('Error fetching patient appointments:', error);
        return { data: null, error: 'Failed to retrieve appointments' };
      }
      
      // Format appointments to match expected structure
      const formattedAppointments = appointments.map((apt: AppointmentData) => {
        const startTime = new Date(apt.start_time);
        const mentor = apt.mentor_profiles || {} as MentorProfile;
        const mentorUsers = mentor.users || [];
        const user = mentorUsers.length > 0 ? mentorUsers[0] : { full_name: 'Unknown', avatar_url: null };
        
        return {
          id: apt.id,
          patient_id: patientProfile.id,
          ambassador_id: mentor.id || '',
          date: startTime.toISOString().split('T')[0],
          time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: apt.meeting_link ? 'video' : 'in-person',
          status: apt.status,
          duration: apt.end_time ? 
            Math.round((new Date(apt.end_time).getTime() - startTime.getTime()) / (1000 * 60)) + ' min' : 
            '30 min',
          created_at: apt.created_at,
          updated_at: apt.updated_at,
          notes: apt.notes || '',
          cancellation_reason: apt.status === 'cancelled' ? (apt.notes || null) : null,
          ambassador_name: user.full_name || 'Unknown',
          ambassador_avatar: user.avatar_url || null
        };
      });
      
      return { data: formattedAppointments, error: null };
    } catch (error) {
      errorLog('Error getting patient appointments:', error);
      return { data: null, error: 'Failed to retrieve appointments' };
    }
  }
  
  /**
   * Gets appointments for an ambassador/mood mentor
   * @param ambassadorId The ID of the ambassador
   * @param status Optional status filter (upcoming, completed, cancelled)
   * @returns Promise with the appointments and any error
   */
  async getAmbassadorAppointments(ambassadorId: string, status?: string) {
    try {
      console.log(`Getting appointments for ambassador: ${ambassadorId}, status: ${status || 'all'}`);
      
      // Get mentor profile ID from user ID
      const { data: mentorProfile, error: profileError } = await supabase
        .from('mood_mentor_profiles')
        .select('id')
        .eq('user_id', ambassadorId)
        .single();
      
      if (profileError) {
        errorLog('Error finding mentor profile:', profileError);
        return { data: null, error: 'Mentor profile not found' };
      }
      
      // Build query for appointments
      let query = supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          meeting_link,
          notes,
          created_at,
          updated_at,
          patient_profiles:patient_id(
            id,
            user_id,
            users(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('mentor_id', mentorProfile.id);
      
      // Apply status filter if provided
      if (status) {
        query = query.eq('status', status);
      }
      
      // Execute query
      const { data: appointments, error } = await query.order('start_time', { ascending: true });
      
      if (error) {
        errorLog('Error fetching mentor appointments:', error);
        return { data: null, error: 'Failed to retrieve appointments' };
      }
      
      // Format appointments to match expected structure
      const formattedAppointments = appointments.map((apt: AppointmentData) => {
        const startTime = new Date(apt.start_time);
        const patient = apt.patient_profiles || {} as PatientProfile;
        const patientUsers = patient.users || [];
        const user = patientUsers.length > 0 ? patientUsers[0] : { full_name: 'Unknown', avatar_url: null };
        
        return {
          id: apt.id,
          patient_id: patient.id || '',
          ambassador_id: mentorProfile.id,
          date: startTime.toISOString().split('T')[0],
          time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: apt.meeting_link ? 'video' : 'in-person',
          status: apt.status,
          duration: apt.end_time ? 
            Math.round((new Date(apt.end_time).getTime() - startTime.getTime()) / (1000 * 60)) + ' min' : 
            '30 min',
          created_at: apt.created_at,
          updated_at: apt.updated_at,
          notes: apt.notes || '',
          cancellation_reason: apt.status === 'cancelled' ? (apt.notes || null) : null,
          patient_name: user.full_name || 'Unknown',
          patient_avatar: user.avatar_url || null
        };
      });
      
      return { data: formattedAppointments, error: null };
    } catch (error) {
      errorLog('Error getting ambassador appointments:', error);
      return { data: null, error: 'Failed to retrieve appointments' };
    }
  }
  
  /**
   * Creates a new appointment
   * @param appointmentData The appointment data to create
   * @returns Promise with the created appointment and any error
   */
  async createAppointment(appointmentData: any) {
    try {
      console.log('Creating new appointment:', appointmentData);
      
      // Prepare appointment data for insertion
      const appointmentToInsert = {
        mentor_id: appointmentData.ambassador_id,
        patient_id: appointmentData.patient_id,
        start_time: new Date(`${appointmentData.date}T${appointmentData.time}`).toISOString(),
        end_time: appointmentData.duration ? 
          new Date(new Date(`${appointmentData.date}T${appointmentData.time}`).getTime() + 
            parseInt(appointmentData.duration) * 60 * 1000).toISOString() : 
          new Date(new Date(`${appointmentData.date}T${appointmentData.time}`).getTime() + 
            30 * 60 * 1000).toISOString(), // Default 30 minutes
        status: appointmentData.status || 'scheduled',
        meeting_link: appointmentData.type === 'video' ? 
          (appointmentData.meeting_link || `https://meeting.emotions-app.com/${uuidv4()}`) : 
          null,
        notes: appointmentData.notes || ''
      };
      
      // Insert appointment into database
      const { data: newAppointment, error } = await supabase
        .from('appointments')
        .insert(appointmentToInsert)
        .select()
        .single();
      
      if (error) {
        errorLog('Error inserting appointment:', error);
        return { data: null, error: 'Failed to create appointment' };
      }
      
      // Format and return the new appointment
      return { 
        data: {
          id: newAppointment.id,
          patient_id: appointmentData.patient_id,
          ambassador_id: appointmentData.ambassador_id,
          date: appointmentData.date,
          time: appointmentData.time,
          type: appointmentData.type,
          status: newAppointment.status,
          duration: appointmentData.duration || '30 min',
          created_at: newAppointment.created_at,
          updated_at: newAppointment.updated_at,
          notes: newAppointment.notes,
          cancellation_reason: null,
          meeting_link: newAppointment.meeting_link
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error creating appointment:', error);
      return { data: null, error: 'Failed to create appointment' };
    }
  }
  
  /**
   * Updates the status of an appointment
   * @param appointmentId The ID of the appointment to update
   * @param status The new status (scheduled, completed, cancelled, no_show)
   * @param cancellationReason Optional reason for cancellation
   * @returns Promise with success status and any error
   */
  async updateAppointmentStatus(appointmentId: string, status: string, cancellationReason?: string) {
    try {
      console.log(`Updating appointment ${appointmentId} status to ${status}`);
      
      // Prepare update data
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      // Add cancellation reason to notes if provided
      if (status === 'cancelled' && cancellationReason) {
        updateData.notes = cancellationReason;
      }
      
      // Update appointment in database
      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) {
        errorLog('Error updating appointment status:', error);
        return { success: false, data: null, error: 'Failed to update appointment status' };
      }
      
      return { 
        success: true, 
        data: { 
          id: updatedAppointment.id, 
          status: updatedAppointment.status, 
          updated_at: updatedAppointment.updated_at,
          cancellation_reason: status === 'cancelled' ? updatedAppointment.notes : null
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error updating appointment status:', error);
      return { success: false, data: null, error: 'Failed to update appointment status' };
    }
  }
  
  /**
   * Gets a specific appointment by ID
   * @param appointmentId The ID of the appointment to retrieve
   * @returns Promise with the appointment and any error
   */
  async getAppointmentById(appointmentId: string) {
    try {
      console.log(`Getting appointment with ID: ${appointmentId}`);
      
      // Fetch appointment from database
      const { data: appointment, error } = await supabase
        .from('appointments')
        .select(`
          id,
          start_time,
          end_time,
          status,
          meeting_link,
          notes,
          created_at,
          updated_at,
          mentor_profiles:mentor_id(
            id,
            user_id,
            users(
              id,
              full_name,
              avatar_url
            )
          ),
          patient_profiles:patient_id(
            id,
            user_id,
            users(
              id,
              full_name,
              avatar_url
            )
          )
        `)
        .eq('id', appointmentId)
        .single();
      
      if (error) {
        errorLog('Error fetching appointment by ID:', error);
        return { data: null, error: 'Failed to retrieve appointment' };
      }
      
      if (!appointment) {
        return { data: null, error: 'Appointment not found' };
      }
      
      // Format appointment data
      const startTime = new Date(appointment.start_time);
      const mentor = appointment.mentor_profiles || {} as MentorProfile;
      const patient = appointment.patient_profiles || {} as PatientProfile;
      const mentorUsers = mentor.users || [];
      const patientUsers = patient.users || [];
      const mentorUser = mentorUsers.length > 0 ? mentorUsers[0] : { full_name: 'Unknown', avatar_url: null };
      const patientUser = patientUsers.length > 0 ? patientUsers[0] : { full_name: 'Unknown', avatar_url: null };
      
      const formattedAppointment = {
        id: appointment.id,
        patient_id: patient.id || '',
        ambassador_id: mentor.id || '',
        date: startTime.toISOString().split('T')[0],
        time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: appointment.meeting_link ? 'video' : 'in-person',
        status: appointment.status,
        duration: appointment.end_time ? 
          Math.round((new Date(appointment.end_time).getTime() - startTime.getTime()) / (1000 * 60)) + ' min' : 
          '30 min',
        created_at: appointment.created_at,
        updated_at: appointment.updated_at,
        notes: appointment.notes || '',
        cancellation_reason: appointment.status === 'cancelled' ? (appointment.notes || null) : null,
        meeting_link: appointment.meeting_link,
        ambassador_name: mentorUser.full_name || 'Unknown',
        ambassador_avatar: mentorUser.avatar_url || null,
        patient_name: patientUser.full_name || 'Unknown',
        patient_avatar: patientUser.avatar_url || null
      };
      
      return { data: formattedAppointment, error: null };
    } catch (error) {
      errorLog('Error getting appointment by ID:', error);
      return { data: null, error: 'Failed to retrieve appointment' };
    }
  }
  
  /**
   * Updates an appointment
   * @param appointmentId The ID of the appointment to update
   * @param updates The updates to apply to the appointment
   * @returns Promise with success status and any error
   */
  async updateAppointment(appointmentId: string, updates: any) {
    try {
      console.log(`Updating appointment ${appointmentId}:`, updates);
      
      // Prepare appointment data for update
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      // Map frontend fields to database fields
      if (updates.date && updates.time) {
        updateData.start_time = new Date(`${updates.date}T${updates.time}`).toISOString();
        
        if (updates.duration) {
          const durationInMinutes = parseInt(updates.duration);
          updateData.end_time = new Date(new Date(updateData.start_time).getTime() + 
            durationInMinutes * 60 * 1000).toISOString();
        }
      }
      
      if (updates.status) updateData.status = updates.status;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.type === 'video' && updates.meeting_link) {
        updateData.meeting_link = updates.meeting_link;
      } else if (updates.type === 'in-person') {
        updateData.meeting_link = null;
      }
      
      // Update appointment in database
      const { data: updatedAppointment, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) {
        errorLog('Error updating appointment:', error);
        return { success: false, data: null, error: 'Failed to update appointment' };
      }
      
      return { success: true, data: updatedAppointment, error: null };
    } catch (error) {
      errorLog('Error updating appointment:', error);
      return { success: false, data: null, error: 'Failed to update appointment' };
    }
  }
}

export default new AppointmentService(); 