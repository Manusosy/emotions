/**
 * Profile Service
 * 
 * Handles operations related to user profiles, including:
 * - Schema creation and maintenance
 * - Profile CRUD operations
 * - Profile validation
 */

import { api } from './api';

interface ProfileData {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'patient' | 'moodMentor' | 'admin';
  bio?: string;
  speciality?: string;
  avatarUrl?: string;
  country?: string;
  gender?: string;
  createdAt: string;
  updatedAt: string;
}

// Mock database connection - in a real app, this would connect to a real database
const mockDb = {
  async executeQuery(query: string): Promise<any> {
    console.log('Executing query:', query);
    return { success: true };
  }
};

/**
 * Profile service for managing user profiles
 */
class ProfileService {
  /**
   * Ensures the ambassador/mood mentor profile schema exists
   * In a real app, this would create database tables/collections if they don't exist
   */
  async ensureAmbassadorProfileSchema(): Promise<void> {
    try {
      console.log('Ensuring ambassador profile schema...');
      
      // In a real implementation, this would create DB tables/collections
      await mockDb.executeQuery(`
        CREATE TABLE IF NOT EXISTS mood_mentor_profiles (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT NOT NULL,
          bio TEXT,
          speciality TEXT,
          avatar_url TEXT,
          country TEXT,
          gender TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Ambassador profile schema ensured successfully');
    } catch (error) {
      console.error('Error ensuring ambassador profile schema:', error);
    }
  }

  /**
   * Gets a profile by user ID
   */
  async getProfileByUserId(userId: string, role: 'patient' | 'moodMentor'): Promise<ProfileData | null> {
    try {
      const response = await api.get(`/api/profiles/${userId}?role=${role}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error getting ${role} profile:`, error);
      return null;
    }
  }

  /**
   * Gets a mood mentor profile
   */
  async getMoodMentorProfile(userId: string) {
    try {
      const response = await api.get(`/api/mood-mentors/${userId}/profile`);
      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      console.error('Error getting mood mentor profile:', error);
      return { data: null, error };
    }
  }

  /**
   * Ensures the mood mentor profile schema exists
   * This is an alias for ensureAmbassadorProfileSchema for backward compatibility
   */
  async ensureMoodMentorProfileSchema(): Promise<void> {
    try {
      await api.post('/api/mood-mentors/ensure-schema');
    } catch (error) {
      console.error('Error ensuring mood mentor schema:', error);
    }
  }

  /**
   * Updates a profile
   */
  async updateProfile(userId: string, profileData: Partial<ProfileData>): Promise<{ success: boolean; error: any }> {
    try {
      await api.put(`/api/profiles/${userId}`, profileData);
      return { success: true, error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error };
    }
  }
}

export const profileService = new ProfileService(); 