/**
 * Mood Mentor Service
 * 
 * This service handles all interactions with mood mentors in the system.
 */

import { supabase } from "../client";

// Sample mock mood mentor data
const mockMentors = [
  {
    id: "1",
    user_id: "user_1",
    full_name: "Dr. Sarah Johnson",
    email: "sarah.j@example.com",
    bio: "Licensed clinical psychologist with 10+ years of experience in anxiety and depression treatment.",
    speciality: "Anxiety & Depression",
    specialties: ["Anxiety", "Depression", "Stress Management"],
    location: "Kigali, Rwanda",
    languages: ["English", "French"],
    availability: "Mon-Fri, 9AM-5PM",
    rating: 4.9,
    reviews_count: 120,
    avatar_url: "https://example.com/avatars/sarah.jpg",
    hourly_rate: 100,
    is_verified: true,
    status: "active"
  },
  // Add more mock mentors as needed
];

/**
 * Mood Mentor service for managing mood mentor data and interactions
 */
class MoodMentorService {
  /**
   * Get all mood mentors
   * @returns List of all mood mentors
   */
  async getMentors() {
    console.log('Getting all mood mentors');
    
    // For now, return mock data
    return { data: mockMentors, error: null };
  }

  /**
   * Get mood mentor by ID
   * @param id The mood mentor ID to look up
   * @returns The mood mentor object if found
   */
  async getMentorById(id: string) {
    console.log(`Getting mood mentor with ID: ${id}`);
    
    const mentor = mockMentors.find(m => m.id === id || m.user_id === id);
    
    if (mentor) {
      return { data: mentor, error: null };
    }
    
    return { data: null, error: { message: 'Mood mentor not found' } };
  }

  /**
   * Get mood mentor profile
   * @param userId The user ID associated with the mood mentor
   * @returns The mood mentor profile if found
   */
  async getMentorProfile(userId: string) {
    console.log(`Getting mood mentor profile for user: ${userId}`);
    
    const mentor = mockMentors.find(m => m.user_id === userId);
    
    if (mentor) {
      return { data: mentor, error: null };
    }
    
    return { data: null, error: { message: 'Profile not found' } };
  }

  // Create a mood mentor profile from user data
  async createMentorProfile(userData: any) {
    const newMentor = {
      id: Math.random().toString(),
      user_id: userData.id,
      full_name: userData.full_name || userData.name || 'New Mood Mentor',
      email: userData.email,
      bio: '',
      speciality: '',
      specialties: [],
      location: '',
      languages: ['English'],
      availability: '',
      rating: 0,
      reviews_count: 0,
      avatar_url: userData.avatar_url || '',
      hourly_rate: 0,
      is_verified: false,
      status: 'pending'
    };

    return { data: newMentor, error: null };
  }

  /**
   * Search for mood mentors
   * @param searchTerm The search term to filter by
   * @returns List of matching mood mentors
   */
  async searchMentors(searchTerm: string) {
    console.log(`Searching mood mentors with term: ${searchTerm}`);
    
    if (!searchTerm) {
      return { data: mockMentors, error: null };
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = mockMentors.filter(mentor =>
      mentor.full_name.toLowerCase().includes(lowerSearchTerm) ||
      mentor.bio.toLowerCase().includes(lowerSearchTerm) ||
      mentor.speciality.toLowerCase().includes(lowerSearchTerm) ||
      mentor.specialties.some(s => s.toLowerCase().includes(lowerSearchTerm))
    );

    return { data: filtered, error: null };
  }

  /**
   * Update mood mentor profile
   * @param userId The user ID associated with the mood mentor
   * @param profileData The updated profile data
   */
  async updateMentorProfile(userId: string, profileData: any) {
    console.log(`Updating mood mentor profile for user: ${userId}`);
    return { data: { ...profileData, updated_at: new Date().toISOString() }, error: null };
  }

  /**
   * Get featured mood mentors
   * @param limit Number of featured mentors to return
   * @returns List of featured mood mentors
   */
  async getFeaturedMentors(limit = 4) {
    console.log(`Getting featured mood mentors, limit: ${limit}`);
    
    // For demo, just return first n mentors
    const featured = [...mockMentors]
      .sort(() => Math.random() - 0.5)
      .slice(0, limit);
    
    return { data: featured, error: null };
  }

  /**
   * Get formatted mood mentor data
   * @param mentorId The mood mentor ID
   * @returns Formatted mood mentor data
   */
  async getFormattedMoodMentorData(mentorId: string) {
    const { data, error } = await this.getMentorById(mentorId);
    if (error) {
      return { success: false, error, data: null };
    }
    return { success: true, data, error: null };
  }

  /**
   * Get dashboard stats for a mood mentor
   * @param userId The user ID
   * @returns Dashboard statistics
   */
  async getDashboardStats(userId: string) {
    // Mock stats for now
    return {
      success: true,
      data: {
        totalPatients: 25,
        activeAppointments: 8,
        completedSessions: 150,
        averageRating: 4.8,
        recentReviews: 12,
        upcomingAppointments: 5
      },
      error: null
    };
  }

  /**
   * Get recent activities for a mood mentor
   * @param userId The user ID
   * @param limit Number of activities to return
   * @returns Recent activities
   */
  async getRecentActivities(userId: string, limit: number) {
    // Mock activities for now
    return {
      success: true,
      data: [
        {
          id: '1',
          type: 'appointment',
          description: 'New appointment scheduled',
          timestamp: new Date().toISOString()
        },
        // Add more mock activities as needed
      ],
      error: null
    };
  }

  /**
   * Get available mood mentors
   * @returns List of available mood mentors
   */
  async getAvailableMoodMentors() {
    const { data, error } = await this.getMentors();
    if (error) {
      return { success: false, error, data: null };
    }
    const availableMentors = data.filter(mentor => mentor.status === 'active');
    return { success: true, data: availableMentors, error: null };
  }

  /**
   * Set a user as a mood mentor
   * @param userId The user ID to set as mood mentor
   * @returns Success status
   */
  async setUserAsMoodMentor(userId: string) {
    try {
      // Mock implementation for now
      return {
        success: true,
        data: {
          userId,
          role: 'mood_mentor',
          status: 'active'
        },
        error: null
      };
    } catch (error) {
      return { success: false, data: null, error };
    }
  }

  /**
   * Ensure the dashboard schema exists
   */
  async ensureDashboardSchema() {
    // This would typically create necessary tables and indexes
    console.log('Ensuring mood mentor dashboard schema exists');
    return true;
  }
}

export const moodMentorService = new MoodMentorService(); 