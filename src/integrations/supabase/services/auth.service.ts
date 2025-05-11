import { supabase } from '../client';
import type { UserRole } from '@/hooks/use-auth';
import { getDeviceInfo } from '@/utils/device-detection';

export type AuthSignUpData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  country: string;
  gender?: string | null;
};

class AuthService {
  /**
   * Sign up a new user
   */
  async signUp(data: AuthSignUpData) {
    console.log('Signing up user with data:', {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      country: data.country
    });

    try {
      // Get device information
      const deviceInfo = getDeviceInfo();

      // Step 1: Create auth user
      const authResponse = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
            role: data.role,
            country: data.country,
            gender: data.gender || null,
            current_session: {
              device_type: deviceInfo.deviceType,
              browser: deviceInfo.browser,
              os: deviceInfo.os,
              last_login: new Date().toISOString(),
              user_agent: deviceInfo.fullUserAgent
            }
          }
        }
      });

      if (authResponse.error) {
        console.error('Auth signup error:', authResponse.error);
        throw authResponse.error;
      }

      console.log('User created in auth:', authResponse.data.user?.id);

      // Important: No need to manually insert into the users table
      // The database trigger should handle this for us
      
      // Step 3: Return the signup data
      return authResponse;
    } catch (error) {
      console.error('Signup process failed:', error);
      throw error;
    }
  }

  /**
   * Sign in a user
   */
  async signIn({ email, password }: { email: string; password: string }) {
    try {
      const signInResponse = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (signInResponse.error) {
        console.error('Sign in error:', signInResponse.error);
        throw signInResponse.error;
      }
      
      return signInResponse;
    } catch (error) {
      console.error('Sign in process failed:', error);
      throw error;
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      return await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  async getUser() {
    try {
      return await supabase.auth.getUser();
    } catch (error) {
      console.error('Get user failed:', error);
      throw error;
    }
  }

  /**
   * Get current session
   */
  async getSession() {
    try {
      return await supabase.auth.getSession();
    } catch (error) {
      console.error('Get session failed:', error);
      throw error;
    }
  }

  /**
   * Set session
   */
  async setSession(accessToken: string, refreshToken: string) {
    try {
      return await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } catch (error) {
      console.error('Set session failed:', error);
      throw error;
    }
  }

  /**
   * Refresh session
   */
  async refreshSession() {
    try {
      return await supabase.auth.refreshSession();
    } catch (error) {
      console.error('Refresh session failed:', error);
      throw error;
    }
  }

  /**
   * Reset password for a user
   */
  async resetPassword(email: string) {
    try {
      return await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password/confirm`
      });
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    try {
      return await supabase.auth.updateUser({
        password: newPassword
      });
    } catch (error) {
      console.error('Update password failed:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 