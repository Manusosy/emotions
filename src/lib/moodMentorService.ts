/**
 * Mood Mentor Service
 * 
 * Handles operations related to mood mentors, including:
 * - Dashboard functionality
 * - Appointment management
 * - Patient management
 * - Resource management
 */

import { api } from './api';
import { errorLog, devLog } from "@/utils/environment";

interface MoodMentorStats {
  totalSessions: number;
  activeClients: number;
  totalHours: number;
  averageRating: number;
}

export interface MoodMentorProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  bio: string;
  specialty: string;
  specialties: string[];
  location: string;
  languages: string[];
  availability_status: string;
  avatar_url: string;
  education: {
    university: string;
    degree: string;
    period: string;
  }[];
  experience: {
    company: string;
    position: string;
    period: string;
    duration: string;
  }[];
  credentials: string;
  therapyTypes: {
    name: string;
    iconName: string;
  }[];
  services: string[];
  awards: {
    title: string;
    year: string;
    description: string;
  }[];
  consultation_fee: number;
  isFree: boolean;
  gallery_images: string[];
  created_at: string;
  updated_at: string;
}

interface MoodMentor {
  id: string;
  full_name: string;
  avatar_url: string;
  specialties: string[];
  location: string;
  duration: string;
  rating: number;
  available: boolean;
  languages: string[];
  education: string;
  experience: string;
}

export interface Appointment {
  id: string;
  startTime: string;
  endTime: string;
  mentorId: string;
  patientId: string;
  status: string;
  type: string;
  notes?: string;
}

// Mock database connection - in a real app, this would connect to a real database
const mockDb = {
  async executeQuery(query: string): Promise<any> {
    console.log('Executing query:', query);
    return { success: true };
  }
};

/**
 * Service for managing mood mentor functionality
 */
class MoodMentorService {
  /**
   * Ensures necessary database schemas exist for the mood mentor dashboard
   * In a real app, this would create database tables/collections if they don't exist
   */
  async ensureDashboardSchema(): Promise<void> {
    try {
      console.log('Ensuring mood mentor dashboard schema...');
      
      // In a real implementation, this would create the necessary database tables
      // Create appointments table
      await mockDb.executeQuery(`
        CREATE TABLE IF NOT EXISTS mood_mentor_appointments (
          id TEXT PRIMARY KEY,
          mentor_id TEXT NOT NULL,
          patient_id TEXT NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          status TEXT NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create availability table
      await mockDb.executeQuery(`
        CREATE TABLE IF NOT EXISTS mood_mentor_availability (
          id TEXT PRIMARY KEY,
          mentor_id TEXT NOT NULL,
          day_of_week INTEGER NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT NOT NULL,
          is_available BOOLEAN NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Create reviews table
      await mockDb.executeQuery(`
        CREATE TABLE IF NOT EXISTS mood_mentor_reviews (
          id TEXT PRIMARY KEY,
          mentor_id TEXT NOT NULL,
          patient_id TEXT NOT NULL,
          rating INTEGER NOT NULL,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Mood mentor dashboard schema ensured successfully');
    } catch (error) {
      console.error('Error ensuring mood mentor dashboard schema:', error);
    }
  }

  /**
   * Gets a mood mentor's profile
   * @param userId The user ID of the mood mentor
   * @returns Promise with the profile data and any error
   */
  async getMentorProfile(userId: string) {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}`);
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error getting mood mentor profile:', error);
      return { data: null, error: 'Failed to fetch profile' };
    }
  }

  /**
   * Gets all mood mentor profiles
   * @returns Promise with the profiles data and any error
   */
  async getMentorProfiles() {
    try {
      const response = await api.get('/api/mood-mentors');
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error getting mood mentor profiles:', error);
      return { data: null, error: 'Failed to fetch profiles' };
    }
  }

  /**
   * Updates a mood mentor's profile
   * @param userId The user ID of the mood mentor
   * @param profileData The profile data to update
   * @returns Promise with the updated profile and any error
   */
  async updateMentorProfile(userId: string, profileData: Partial<MoodMentorProfile>) {
    try {
      const response = await api.patch(`/api/mood-mentors/${userId}`, profileData);
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating mood mentor profile:', error);
      return { data: null, error: 'Failed to update profile' };
    }
  }

  /**
   * Creates a new mood mentor profile
   * @param profileData The profile data to create
   * @returns Promise with the created profile and any error
   */
  async createMentorProfile(profileData: Partial<MoodMentorProfile>) {
    try {
      const response = await api.post('/api/mood-mentors', profileData);
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error creating mood mentor profile:', error);
      return { data: null, error: 'Failed to create profile' };
    }
  }

  /**
   * Get mood mentor statistics
   * @param userId The user ID associated with the mood mentor
   */
  async getMentorStats(userId: string): Promise<{ success: boolean; data: MoodMentorStats | null; error: any }> {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}/stats`);
      const data = await response.json();
      return { success: true, data, error: null };
    } catch (error) {
      console.error('Error fetching mentor stats:', error);
      return { success: false, data: null, error };
    }
  }

  /**
   * Get mood mentor appointments
   * @param userId The user ID associated with the mood mentor
   */
  async getAppointments(userId: string) {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}/appointments`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  /**
   * Get mood mentor dashboard statistics
   * @param userId The user ID associated with the mood mentor
   */
  async getDashboardStats(userId: string) {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}/stats`);
      
      if (!response.ok) {
        throw new Error("Failed to get mentor dashboard stats");
      }
      
      const data = await response.json();
      
      return {
        patientsCount: data.patientsCount || 0,
        appointmentsCount: data.appointmentsCount || 0,
        groupsCount: data.groupsCount || 0,
        ratingPercentage: data.ratingPercentage || 0,
        reviewsCount: data.reviewsCount || 0
      };
    } catch (error) {
      errorLog("Error fetching mentor dashboard stats:", error);
      
      // Return default values
      return {
        patientsCount: 0,
        appointmentsCount: 0,
        groupsCount: 0,
        ratingPercentage: 0,
        reviewsCount: 0
      };
    }
  }

  /**
   * Get mood mentor recent activities
   * @param userId The user ID associated with the mood mentor
   * @param limit Optional limit for number of activities
   */
  async getRecentActivities(userId: string, limit = 5) {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}/activities?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to get mentor activities");
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      errorLog("Error fetching mentor activities:", error);
      
      return {
        success: false,
        data: null,
        error: "Failed to fetch activities"
      };
    }
  }

  /**
   * Gets available time slots for a mood mentor
   * @param mentorId The ID of the mood mentor
   * @param date The date to check availability for
   * @returns Promise with the available slots and any error
   */
  async getAvailableSlots(mentorId: string, date: Date) {
    try {
      const response = await api.get(`/api/mood-mentors/${mentorId}/availability?date=${date.toISOString()}`);
      const data = await response.json();
      
      return { data, error: null };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return { data: null, error: 'Failed to fetch availability' };
    }
  }

  /**
   * Get highlighted mood mentors
   * @param limit Number of mentors to return
   * @returns Highlighted mood mentors
   */
  async getHighlightedMentors(limit = 3) {
    try {
      const response = await api.get(`/api/mood-mentors/highlighted?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error("Failed to get highlighted mentors");
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      errorLog("Error fetching highlighted mentors:", error);
      
      return {
        success: false,
        data: null,
        error: "Failed to fetch highlighted mentors"
      };
    }
  }
  
  /**
   * Get a mood mentor by ID
   * @param mentorId The mood mentor's ID
   * @returns The mood mentor
   */
  async getMentorById(mentorId: string) {
    try {
      const response = await api.get(`/api/mood-mentors/${mentorId}`);
      
      if (!response.ok) {
        throw new Error("Failed to get mentor details");
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      errorLog("Error fetching mentor details:", error);
      
      return {
        success: false,
        data: null,
        error: "Failed to fetch mentor details"
      };
    }
  }
  
  /**
   * Search for mood mentors
   * @param query Search query
   * @returns Matching mood mentors
   */
  async searchMentors(query: string) {
    try {
      const response = await api.get(`/api/mood-mentors/search?q=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error("Failed to search mentors");
      }
      
      const data = await response.json();
      
      return {
        success: true,
        data,
        error: null
      };
    } catch (error) {
      errorLog("Error searching mentors:", error);
      
      return {
        success: false,
        data: null,
        error: "Failed to search mentors"
      };
    }
  }
}

export const moodMentorService = new MoodMentorService(); 