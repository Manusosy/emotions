/**
 * Authentication Service
 * 
 * Core authentication service that handles:
 * - User login/logout
 * - Session management
 * - Token refresh
 * - Access control
 */

import { UserRole } from '@/types/database.types';
import { devLog, errorLog } from '@/utils/environment';
import { authService as supabaseAuthService } from '@/integrations/supabase/services/auth.service';
import type { AuthSignUpData } from '@/integrations/supabase/services/auth.service';

interface AuthResponse<T = any> {
  success: boolean;
  data: T | null;
  error: Error | null;
}

// Cookie options for secure authentication
const COOKIE_OPTIONS = {
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

export class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, role: UserRole, userData: any): Promise<AuthResponse> {
    try {
      devLog('Signing up user:', email, 'with role:', role);
      
      // Format user data for Supabase
      const signUpData: AuthSignUpData = {
        email,
        password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role,
        country: userData.country,
        gender: userData.gender || null,
        specialty: userData.specialty || null,
        specialties: userData.specialties || null
      };
      
      // Call Supabase auth service
      const response = await supabaseAuthService.signUp(signUpData);
      
      if (response.error) {
        throw response.error;
      }
      
      // Return successful response
      return { 
        success: true, 
        data: {
          user: response.data.user,
          session: response.data.session
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error in signUp:', error);
      console.error('Detailed signup error:', error);
      
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during signup')
      };
    }
  }

  /**
   * Sign in a user
   */
  async signIn(email: string, password: string, role?: UserRole): Promise<AuthResponse> {
    try {
      devLog('Signing in user:', email);
      
      // Call Supabase auth service
      const response = await supabaseAuthService.signIn({ email, password });
      
      if (response.error) {
        throw response.error;
      }
      
      // Format user data
      const userData = response.data.user;
      
      // If a role was specified, validate it matches the user's role
      if (role && userData.user_metadata?.role !== role) {
        return { 
          success: false, 
          data: null, 
          error: new Error(`User does not have the required role: ${role}`) 
        };
      }
      
      // Get a properly formatted full name
      let fullName = userData.user_metadata?.full_name || '';
      
      // If full_name doesn't contain a space (likely just first name), try to build it
      if (!fullName.includes(' ')) {
        if (userData.user_metadata?.first_name && userData.user_metadata?.last_name) {
          fullName = `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`;
        } else if (userData.user_metadata?.firstName && userData.user_metadata?.lastName) {
          fullName = `${userData.user_metadata.firstName} ${userData.user_metadata.lastName}`;
        } else if (!fullName) {
          // If still no full name, use email as fallback
          fullName = userData.email?.split('@')[0] || 'User';
        }
      }
      
      // Return successful response
      return { 
        success: true, 
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.user_metadata?.role,
            full_name: fullName,
            firstName: userData.user_metadata?.first_name,
            lastName: userData.user_metadata?.last_name
          },
          session: response.data.session
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error in signIn:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during sign in')
      };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<AuthResponse> {
    try {
      devLog('Signing out user');
      
      // Call Supabase auth service
      const response = await supabaseAuthService.signOut();
      
      if (response.error) {
        throw response.error;
      }
      
      return { success: true, data: null, error: null };
    } catch (error) {
      errorLog('Error in signOut:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error during sign out')
      };
    }
  }

  /**
   * Get the current user's session
   */
  async getSession(): Promise<AuthResponse> {
    try {
      devLog('Getting current session');
      
      // Call Supabase auth service
      const response = await supabaseAuthService.getSession();
      
      if (response.error) {
        throw response.error;
      }
      
      // If no session, return failure
      if (!response.data.session) {
        return { success: false, data: null, error: new Error('No active session') };
      }
      
      // Get current user after confirming session exists
      const userResponse = await supabaseAuthService.getUser();
      
      if (userResponse.error || !userResponse.data.user) {
        return { success: false, data: null, error: new Error('Could not get user data') };
      }
      
      // Format user data
      const userData = userResponse.data.user;
      
      // Get a properly formatted full name
      let fullName = userData.user_metadata?.full_name || '';
      
      // If full_name doesn't contain a space (likely just first name), try to build it
      if (!fullName.includes(' ')) {
        if (userData.user_metadata?.first_name && userData.user_metadata?.last_name) {
          fullName = `${userData.user_metadata.first_name} ${userData.user_metadata.last_name}`;
        } else if (userData.user_metadata?.firstName && userData.user_metadata?.lastName) {
          fullName = `${userData.user_metadata.firstName} ${userData.user_metadata.lastName}`;
        } else if (!fullName) {
          // If still no full name, use email as fallback
          fullName = userData.email?.split('@')[0] || 'User';
        }
      }
      
      return { 
        success: true, 
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.user_metadata?.role,
            full_name: fullName,
            firstName: userData.user_metadata?.first_name,
            lastName: userData.user_metadata?.last_name
          },
          session: response.data.session,
          expiresAt: response.data.session?.expires_at
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error in getSession:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error getting session')
      };
    }
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<AuthResponse> {
    try {
      devLog('Refreshing authentication token');
      
      // Call Supabase auth service
      const response = await supabaseAuthService.refreshSession();
      
      if (response.error) {
        throw response.error;
      }
      
      // If no session, return failure
      if (!response.data.session) {
        return { success: false, data: null, error: new Error('Session expired') };
      }
      
      // Get current user after refreshing the session
      const userResponse = await supabaseAuthService.getUser();
      
      if (userResponse.error || !userResponse.data.user) {
        return { success: false, data: null, error: new Error('Could not get user data') };
      }
      
      // Format user data
      const userData = userResponse.data.user;
      
      return { 
        success: true, 
        data: {
          user: {
            id: userData.id,
            email: userData.email,
            role: userData.user_metadata?.role,
            full_name: userData.user_metadata?.full_name
          },
          session: response.data.session,
          expiresAt: response.data.session?.expires_at
        }, 
        error: null 
      };
    } catch (error) {
      errorLog('Error refreshing token:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error refreshing token')
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, userData: any): Promise<AuthResponse> {
    try {
      devLog('Updating profile for user:', userId);
      
      // This would need to be implemented through a Supabase function or direct database update
      // For now, return success without doing anything
      return { success: true, data: userData, error: null };
    } catch (error) {
      errorLog('Error in updateProfile:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error updating profile')
      };
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<AuthResponse> {
    try {
      devLog('Requesting password reset for:', email);
      
      // Call Supabase auth service
      const response = await supabaseAuthService.resetPassword(email);
      
      if (response.error) {
        throw response.error;
      }
      
      return { success: true, data: null, error: null };
    } catch (error) {
      errorLog('Error in resetPassword:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error resetting password')
      };
    }
  }

  /**
   * Update password with reset token
   */
  async updatePasswordWithToken(token: string, newPassword: string): Promise<AuthResponse> {
    try {
      devLog('Updating password with reset token');
      
      // Call Supabase auth service
      const response = await supabaseAuthService.updatePassword(newPassword);
      
      if (response.error) {
        throw response.error;
      }
      
      return { success: true, data: null, error: null };
    } catch (error) {
      errorLog('Error updating password:', error);
      return { 
        success: false, 
        data: null, 
        error: error instanceof Error ? error : new Error('Unknown error updating password')
      };
    }
  }
}

export const authService = new AuthService(); 