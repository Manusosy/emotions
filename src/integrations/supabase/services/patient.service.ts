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

/**
 * Mock appointment reports data for different filter types
 */
const mockAppointmentReports = {
  all: [
    {
      id: 'EMHA01',
      date: '12 Nov 2023',
      time: '10:00 AM',
      type: 'Video Consultation',
      status: 'Upcoming',
      ambassador: {
        name: 'Dr. Sophie Chen',
        specialization: 'Psychiatrist'
      },
      notes: 'Follow-up on medication efficacy'
    },
    {
      id: 'EMHA02',
      date: '18 Nov 2023',
      time: '2:30 PM',
      type: 'Phone Call',
      status: 'Upcoming',
      ambassador: {
        name: 'Michael Roberts',
        specialization: 'Wellness Coach'
      },
      notes: 'Weekly check-in'
    },
    {
      id: 'EMHA03',
      date: '25 Nov 2023',
      time: '11:15 AM',
      type: 'In-person',
      status: 'Upcoming',
      ambassador: {
        name: 'Dr. James Wilson',
        specialization: 'Therapist'
      },
      notes: 'Therapy session'
    },
    {
      id: 'EMHP01',
      date: '10 Oct 2023',
      time: '9:00 AM',
      type: 'Video Consultation',
      status: 'Completed',
      ambassador: {
        name: 'Dr. Sophie Chen',
        specialization: 'Psychiatrist'
      },
      notes: 'Initial evaluation'
    },
    {
      id: 'EMHP02',
      date: '17 Oct 2023',
      time: '3:30 PM',
      type: 'Phone Call',
      status: 'Completed',
      ambassador: {
        name: 'Michael Roberts',
        specialization: 'Wellness Coach'
      },
      notes: 'Stress management techniques discussion'
    },
    {
      id: 'EMHC01',
      date: '5 Nov 2023',
      time: '1:00 PM',
      type: 'Video Consultation',
      status: 'Cancelled',
      ambassador: {
        name: 'Dr. James Wilson',
        specialization: 'Therapist'
      },
      notes: 'Patient requested cancellation'
    }
  ],
  upcoming: [
    {
      id: 'EMHA01',
      date: '12 Nov 2023',
      time: '10:00 AM',
      type: 'Video Consultation',
      status: 'Upcoming',
      ambassador: {
        name: 'Dr. Sophie Chen',
        specialization: 'Psychiatrist'
      },
      notes: 'Follow-up on medication efficacy'
    },
    {
      id: 'EMHA02',
      date: '18 Nov 2023',
      time: '2:30 PM',
      type: 'Phone Call',
      status: 'Upcoming',
      ambassador: {
        name: 'Michael Roberts',
        specialization: 'Wellness Coach'
      },
      notes: 'Weekly check-in'
    },
    {
      id: 'EMHA03',
      date: '25 Nov 2023',
      time: '11:15 AM',
      type: 'In-person',
      status: 'Upcoming',
      ambassador: {
        name: 'Dr. James Wilson',
        specialization: 'Therapist'
      },
      notes: 'Therapy session'
    }
  ],
  completed: [
    {
      id: 'EMHP01',
      date: '10 Oct 2023',
      time: '9:00 AM',
      type: 'Video Consultation',
      status: 'Completed',
      ambassador: {
        name: 'Dr. Sophie Chen',
        specialization: 'Psychiatrist'
      },
      notes: 'Initial evaluation'
    },
    {
      id: 'EMHP02',
      date: '17 Oct 2023',
      time: '3:30 PM',
      type: 'Phone Call',
      status: 'Completed',
      ambassador: {
        name: 'Michael Roberts',
        specialization: 'Wellness Coach'
      },
      notes: 'Stress management techniques discussion'
    }
  ],
  cancelled: [
    {
      id: 'EMHC01',
      date: '5 Nov 2023',
      time: '1:00 PM',
      type: 'Video Consultation',
      status: 'Cancelled',
      ambassador: {
        name: 'Dr. James Wilson',
        specialization: 'Therapist'
      },
      notes: 'Patient requested cancellation'
    }
  ]
};

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
      
      // In a real implementation, this would query a database
      // For the mock service, we'll return pre-defined data
      
      // Simulate a brief delay as if we were calling an API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true,
        data: this.getMockAppointmentReports(filter),
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
   * Gets mock appointment reports for a specific filter
   * @param filter The filter to apply (all, upcoming, completed, cancelled)
   * @returns Array of mock appointment reports
   */
  getMockAppointmentReports(filter: string = 'all') {
    // Return the appropriate filtered mock data
    if (Object.prototype.hasOwnProperty.call(mockAppointmentReports, filter)) {
      return mockAppointmentReports[filter as keyof typeof mockAppointmentReports];
    }
    
    // Default to "all" if filter is not recognized
    return mockAppointmentReports.all;
  }
  
  /**
   * Gets a patient's profile data
   * @param patientId The ID of the patient
   * @returns Promise with the patient profile and success/error status
   */
  async getPatientProfile(patientId: string) {
    try {
      console.log(`Getting profile for patient: ${patientId}`);
      
      // In a real implementation, this would query a database
      // For the mock service, we'll return mock data
      
      return { 
        success: true,
        data: {
          id: patientId,
          patient_id: `EMHA-${patientId.substring(0, 4)}`,
          first_name: 'Demo',
          last_name: 'User',
          email: 'demo@example.com',
          phone_number: '+1234567890',
          date_of_birth: '1990-01-01',
          country: 'United States',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          pincode: '12345',
          avatar_url: '',
          created_at: new Date().toISOString()
        },
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
      
      // In a real implementation, this would query a database
      // For the mock service, we'll return mock data
      
      return { 
        success: true,
        data: {
          moodScore: 75,
          stressLevel: 45,
          consistency: 80,
          lastCheckInStatus: "Good",
          streak: 7,
          firstCheckInDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
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

export const patientService = new PatientService(); 