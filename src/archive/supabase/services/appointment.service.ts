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

/**
 * Mock appointments data
 */
const mockAppointments = [
  {
    id: 'apt-1',
    patient_id: 'patient-1',
    ambassador_id: 'amb-123',
    date: '2023-12-01',
    time: '10:00 AM',
    type: 'video',
    status: 'upcoming',
    duration: '30 min',
    created_at: '2023-11-20T10:30:00Z',
    updated_at: '2023-11-20T10:30:00Z',
    notes: '',
    cancellation_reason: null
  },
  {
    id: 'apt-2',
    patient_id: 'patient-1',
    ambassador_id: 'amb-456',
    date: '2023-11-28',
    time: '2:30 PM',
    type: 'audio',
    status: 'upcoming',
    duration: '45 min',
    created_at: '2023-11-15T14:20:00Z',
    updated_at: '2023-11-15T14:20:00Z',
    notes: 'Follow-up session',
    cancellation_reason: null
  },
  {
    id: 'apt-3',
    patient_id: 'patient-1',
    ambassador_id: 'amb-789',
    date: '2023-11-15',
    time: '11:00 AM',
    type: 'video',
    status: 'completed',
    duration: '60 min',
    created_at: '2023-11-10T09:45:00Z',
    updated_at: '2023-11-15T12:15:00Z',
    notes: 'Initial consultation',
    cancellation_reason: null
  }
];

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
      
      // Filter appointments based on patient ID and optional status
      let appointments = mockAppointments.filter(apt => apt.patient_id === patientId);
      
      if (status) {
        appointments = appointments.filter(apt => apt.status === status);
      }
      
      return { data: appointments, error: null };
    } catch (error) {
      console.error('Error getting patient appointments:', error);
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
      
      // Filter appointments based on ambassador ID and optional status
      let appointments = mockAppointments.filter(apt => apt.ambassador_id === ambassadorId);
      
      if (status) {
        appointments = appointments.filter(apt => apt.status === status);
      }
      
      return { data: appointments, error: null };
    } catch (error) {
      console.error('Error getting ambassador appointments:', error);
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
      
      // Generate a unique ID for the new appointment
      const id = `apt-${uuidv4().slice(0, 8)}`;
      
      // Create the new appointment with current timestamps
      const newAppointment = {
        id,
        ...appointmentData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        cancellation_reason: null
      };
      
      // In a real implementation, this would save to a database
      // For now, we'll just return the new appointment
      
      return { data: newAppointment, error: null };
    } catch (error) {
      console.error('Error creating appointment:', error);
      return { data: null, error: 'Failed to create appointment' };
    }
  }
  
  /**
   * Updates the status of an appointment
   * @param appointmentId The ID of the appointment to update
   * @param status The new status (upcoming, completed, cancelled)
   * @param cancellationReason Optional reason for cancellation
   * @returns Promise with success status and any error
   */
  async updateAppointmentStatus(appointmentId: string, status: string, cancellationReason?: string) {
    try {
      console.log(`Updating appointment ${appointmentId} status to ${status}`);
      
      // In a real implementation, this would update the database
      // For now, just log the change and return success
      
      if (status === 'cancelled' && !cancellationReason) {
        console.warn('Cancellation without a reason provided');
      }
      
      return { 
        success: true, 
        data: { 
          id: appointmentId, 
          status, 
          updated_at: new Date().toISOString(),
          cancellation_reason: status === 'cancelled' ? cancellationReason : null
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error updating appointment status:', error);
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
      
      // Find the appointment in the mock data
      const appointment = mockAppointments.find(apt => apt.id === appointmentId);
      
      if (appointment) {
        return { data: appointment, error: null };
      } else {
        return { data: null, error: 'Appointment not found' };
      }
    } catch (error) {
      console.error('Error getting appointment by ID:', error);
      return { data: null, error: 'Failed to retrieve appointment' };
    }
  }
  
  /**
   * Updates appointment details
   * @param appointmentId The ID of the appointment to update
   * @param updates The updates to apply to the appointment
   * @returns Promise with the updated appointment and any error
   */
  async updateAppointment(appointmentId: string, updates: any) {
    try {
      console.log(`Updating appointment: ${appointmentId}`, updates);
      
      // In a real implementation, this would update the database
      // For now, return a mock success response
      
      return { 
        success: true, 
        data: { 
          id: appointmentId,
          ...updates,
          updated_at: new Date().toISOString()
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error updating appointment:', error);
      return { success: false, data: null, error: 'Failed to update appointment' };
    }
  }
}

export const appointmentService = new AppointmentService(); 