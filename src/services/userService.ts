import { api } from "@/lib/api";
import { fetchWithErrorHandling } from "@/utils/error-handling";
import { errorLog, devLog } from "@/utils/environment";

/**
 * Service for user-related operations
 */
interface UserService {
  /**
   * Delete a user account
   * @param userId The ID of the user to delete
   */
  deleteUserAccount: (userId: string) => Promise<void>;
  
  /**
   * Get user profile
   * @param userId The ID of the user
   */
  getUserProfile: (userId: string) => Promise<any>;
  
  /**
   * Update user profile
   * @param userId The ID of the user
   * @param profileData The updated profile data
   */
  updateUserProfile: (userId: string, profileData: any) => Promise<any>;
}

/**
 * Implementation of the UserService interface using the API client
 */
export const userService: UserService = {
  /**
   * Delete a user account
   * @param userId The ID of the user to delete
   */
  deleteUserAccount: async (userId: string) => {
    devLog(`Deleting user account: ${userId}`);
    
    const { error } = await fetchWithErrorHandling(
      () => api.delete(`/api/users/${userId}`),
      {
        defaultErrorMessage: "Failed to delete user account",
        showErrorToast: true
      }
    );
    
    if (error) {
      errorLog("Error deleting user account:", error);
      throw error;
    }
  },
  
  /**
   * Get user profile
   * @param userId The ID of the user
   */
  getUserProfile: async (userId: string) => {
    devLog(`Getting user profile: ${userId}`);
    
    const { data, error } = await fetchWithErrorHandling(
      () => api.get(`/api/users/${userId}/profile`),
      {
        defaultErrorMessage: "Failed to get user profile",
        showErrorToast: false
      }
    );
    
    if (error) {
      errorLog("Error getting user profile:", error);
      throw error;
    }
    
    return data;
  },
  
  /**
   * Update user profile
   * @param userId The ID of the user
   * @param profileData The updated profile data
   */
  updateUserProfile: async (userId: string, profileData: any) => {
    devLog(`Updating user profile: ${userId}`);
    
    const { data, error } = await fetchWithErrorHandling(
      () => api.put(`/api/users/${userId}/profile`, profileData),
      {
        defaultErrorMessage: "Failed to update user profile",
        showErrorToast: true,
        successMessage: "Profile updated successfully"
      }
    );
    
    if (error) {
      errorLog("Error updating user profile:", error);
      throw error;
    }
    
    return data;
  }
}; 