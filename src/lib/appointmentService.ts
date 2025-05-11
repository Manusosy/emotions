import { api } from './api';
import { errorLog, devLog } from '@/utils/environment';

export interface Appointment {
  id: string;
  patient_id: string;
  ambassador_id: string;
  date: string;
  time: string;
  type: 'video' | 'audio';
  status: 'upcoming' | 'completed' | 'cancelled';
  duration: string;
  notes?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

class AppointmentService {
  /**
   * Gets appointments for a patient
   * @param patientId The ID of the patient
   * @param status Optional status filter (upcoming, completed, cancelled)
   * @returns Promise with the appointments and any error
   */
  async getPatientAppointments(patientId: string, status?: string, startDate?: Date, endDate?: Date) {
    try {
      let url = `/api/appointments?patient_id=${patientId}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      if (startDate) {
        url += `&start_date=${startDate.toISOString()}`;
      }
      
      if (endDate) {
        url += `&end_date=${endDate.toISOString()}`;
      }
      
      devLog(`Fetching patient appointments: ${url}`);
      
      const response = await api.get(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      errorLog('Error getting patient appointments:', error);
      return { data: null, error: 'Failed to fetch appointments' };
    }
  }

  /**
   * Creates a new appointment
   * @param appointmentData The appointment data to create
   * @returns Promise with the created appointment and any error
   */
  async createAppointment(appointmentData: Partial<Appointment>) {
    try {
      devLog('Creating new appointment', appointmentData);
      
      const response = await api.post('/api/appointments', appointmentData);
      
      if (!response.ok) {
        throw new Error(`Failed to create appointment: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      errorLog('Error creating appointment:', error);
      return { data: null, error: 'Failed to create appointment' };
    }
  }

  /**
   * Updates an appointment's status
   * @param appointmentId The ID of the appointment to update
   * @param status The new status
   * @param reason Optional reason for cancellation
   * @returns Promise with the updated appointment and any error
   */
  async updateAppointmentStatus(appointmentId: string, status: string, reason?: string) {
    try {
      devLog(`Updating appointment ${appointmentId} status to ${status}`);
      
      const response = await api.patch(`/api/appointments/${appointmentId}`, {
        status,
        cancellation_reason: reason
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update appointment status: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      errorLog('Error updating appointment status:', error);
      return { data: null, error: 'Failed to update appointment status' };
    }
  }

  /**
   * Gets appointments for an ambassador
   * @param ambassadorId The ID of the ambassador
   * @param status Optional status filter
   * @returns Promise with the appointments and any error
   */
  async getAmbassadorAppointments(ambassadorId: string, status?: string) {
    try {
      let url = `/api/appointments?ambassador_id=${ambassadorId}`;
      
      if (status) {
        url += `&status=${status}`;
      }
      
      devLog(`Fetching ambassador appointments: ${url}`);
      
      const response = await api.get(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ambassador appointments: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      errorLog('Error getting ambassador appointments:', error);
      return { data: null, error: 'Failed to fetch appointments' };
    }
  }
}

export const appointmentService = new AppointmentService(); 