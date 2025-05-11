/**
 * Mock User Service
 * 
 * This file provides a mock implementation of the user service
 * that was previously using Supabase. It simulates user management functionality
 * without an actual database connection.
 */

import { v4 as uuidv4 } from 'uuid';

// Sample mock user data
const mockUsers = [
  {
    id: 'mock-profile-1',
    email: 'jane.doe@example.com',
    full_name: 'Jane Doe',
    first_name: 'Jane',
    last_name: 'Doe',
    role: 'moodMentor',
    avatar_url: 'https://randomuser.me/api/portraits/women/44.jpg',
    created_at: '2023-01-01T00:00:00.000Z',
    updated_at: '2023-06-01T00:00:00.000Z',
    speciality: 'Anxiety, Depression',
    specialty: 'Anxiety, Depression',
    specialties: ['Anxiety', 'Depression', 'Stress Management'],
    phone_number: '+1234567890',
    status: 'active',
    credentials: 'Licensed Professional Counselor',
    location: 'San Francisco, CA'
  },
  {
    id: 'patient-1',
    email: 'patient1@example.com',
    full_name: 'Alex Johnson',
    first_name: 'Alex',
    last_name: 'Johnson',
    role: 'patient',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg',
    created_at: '2023-02-15T00:00:00.000Z',
    updated_at: '2023-05-20T00:00:00.000Z',
    status: 'active',
    location: 'New York, NY'
  },
  {
    id: 'patient-2',
    email: 'patient2@example.com',
    full_name: 'Sarah Williams',
    first_name: 'Sarah',
    last_name: 'Williams',
    role: 'patient',
    avatar_url: 'https://randomuser.me/api/portraits/women/67.jpg',
    created_at: '2023-03-10T00:00:00.000Z',
    updated_at: '2023-07-05T00:00:00.000Z',
    status: 'active',
    location: 'Chicago, IL'
  }
];

// User service class
class UserService {
  /**
   * Get a user by ID
   * @param userId The user ID to look up
   * @returns The user object if found
   */
  async getUserById(userId: string) {
    console.log(`Getting user with ID: ${userId}`);
    
    const user = mockUsers.find(u => u.id === userId);
    
    if (user) {
      return { data: user, error: null };
    }
    
    return { data: null, error: { message: 'User not found' } };
  }
  
  /**
   * Get a user by email
   * @param email The email to look up
   * @returns The user object if found
   */
  async getUserByEmail(email: string) {
    console.log(`Getting user with email: ${email}`);
    
    const user = mockUsers.find(u => u.email === email);
    
    if (user) {
      return { data: user, error: null };
    }
    
    return { data: null, error: { message: 'User not found' } };
  }
  
  /**
   * Get all patients for a mood mentor
   * @param mentorId The ID of the mood mentor
   * @returns List of patients
   */
  async getPatientsForMentor(mentorId: string) {
    console.log(`Getting patients for mentor: ${mentorId}`);
    
    // In a real app, this would query a relationships table
    // For mock purposes, we'll just return all users with role 'patient'
    const patients = mockUsers.filter(user => user.role === 'patient');
    
    return { data: patients, error: null };
  }
  
  /**
   * Get all mood mentors
   * @returns List of mood mentors
   */
  async getMoodMentors() {
    console.log('Getting all mood mentors');
    
    const mentors = mockUsers.filter(user => user.role === 'moodMentor');
    
    return { data: mentors, error: null };
  }
  
  /**
   * Update a user profile
   * @param userId The user ID to update
   * @param userData The updated user data
   * @returns The updated user object
   */
  async updateUserProfile(userId: string, userData: Partial<typeof mockUsers[0]>) {
    console.log(`Updating user profile for: ${userId}`);
    
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      mockUsers[userIndex] = {
        ...mockUsers[userIndex],
        ...userData,
        updated_at: new Date().toISOString()
      };
      
      return { data: mockUsers[userIndex], error: null };
    }
    
    return { data: null, error: { message: 'User not found' } };
  }
  
  /**
   * Search for users by name
   * @param searchTerm The search term to use
   * @param role Optional role filter
   * @returns List of matching users
   */
  async searchUsers(searchTerm: string, role?: string) {
    console.log(`Searching users with term: ${searchTerm}${role ? ` and role: ${role}` : ''}`);
    
    let filteredUsers = mockUsers;
    
    // Apply role filter if provided
    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }
    
    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredUsers = filteredUsers.filter(user => 
        user.full_name.toLowerCase().includes(lowerSearchTerm) ||
        user.email.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    return { data: filteredUsers, error: null };
  }
  
  /**
   * Create a new user
   * @param userData The user data to create
   * @returns The created user
   */
  async createUser(userData: Partial<typeof mockUsers[0]>) {
    console.log('Creating new user');
    
    const newUser = {
      id: userData.id || uuidv4(),
      email: userData.email || '',
      full_name: userData.full_name || '',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
      role: userData.role || 'patient',
      avatar_url: userData.avatar_url || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      status: 'active',
      ...userData
    };
    
    mockUsers.push(newUser);
    
    return { data: newUser, error: null };
  }
}

export const userService = new UserService(); 