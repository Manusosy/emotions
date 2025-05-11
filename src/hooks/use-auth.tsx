import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { authService } from '@/lib/auth.service';
import { UserRole } from '@/types/database.types';
import { toast } from 'sonner';
import { errorLog, devLog } from '@/utils/environment';

// Session refresh interval (15 minutes)
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000;

// Buffer time before token expiry to trigger refresh (2 minutes)
const REFRESH_BUFFER_TIME = 2 * 60 * 1000;

// How long to wait after a failed refresh before trying again (30 seconds)
const RETRY_INTERVAL = 30 * 1000;

interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  avatar_url?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  userRole: UserRole | null;
  isLoading: boolean;
  signin: (email: string, password: string, role?: UserRole) => Promise<boolean>;
  signout: () => Promise<void>;
  signup: (userData: any, role: UserRole) => Promise<boolean>;
  resetPassword: (email: string) => Promise<boolean>;
  updateProfile: (userData: any) => Promise<boolean>;
  getDashboardUrlForRole: (role: UserRole | null) => string;
  refreshUserSession: () => Promise<boolean>;
  redirectToDashboard: () => void;
  getFullName: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState<Date | null>(null);
  
  // Use refs to track timers so they can be cleared properly
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Track if a refresh is in progress to avoid multiple simultaneous refreshes
  const isRefreshingRef = useRef(false);

  // Helper function to get the dashboard URL for a role
  const getDashboardUrlForRole = useCallback((role: UserRole | null): string => {
    switch (role) {
      case 'patient':
        return '/patient-dashboard';
      case 'mood_mentor':
        return '/mood-mentor-dashboard';
      case 'admin':
        return '/admin-dashboard';
      default:
        return '/';
    }
  }, []);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }
    
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  // Refresh user session
  const refreshUserSession = useCallback(async (): Promise<boolean> => {
    // Prevent multiple simultaneous refresh requests
    if (isRefreshingRef.current) {
      return false;
    }
    
    try {
      isRefreshingRef.current = true;
      devLog('Refreshing user session...');
      
      const { success, data, error } = await authService.refreshToken();
      
      if (!success || error) {
        errorLog('Session refresh failed:', error);
        return false;
      }
      
      if (data?.user) {
        setUser(data.user);
        setUserRole(data.user.role);
        setIsAuthenticated(true);
        
        // Update session expiry if provided
        if (data.expiresAt) {
          const expiryDate = new Date(data.expiresAt);
          setSessionExpiry(expiryDate);
          scheduleTokenRefresh(expiryDate);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      errorLog('Error refreshing session:', error);
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  }, []);

  // Schedule a token refresh based on expiry time
  const scheduleTokenRefresh = useCallback((expiryDate: Date) => {
    clearTimers();
    
    const now = new Date();
    const timeUntilRefresh = Math.max(
      0,
      expiryDate.getTime() - now.getTime() - REFRESH_BUFFER_TIME
    );
    
    devLog(`Scheduling token refresh in ${timeUntilRefresh / 1000} seconds`);
    
    refreshTimerRef.current = setTimeout(() => {
      refreshUserSession().catch(error => {
        errorLog('Failed to refresh token:', error);
        
        // Schedule a retry
        retryTimerRef.current = setTimeout(() => {
          refreshUserSession().catch(error => {
            errorLog('Retry refresh failed:', error);
            // After a failed retry, we'll set authenticated to false
            setIsAuthenticated(false);
            setUser(null);
            setUserRole(null);
            toast.error('Your session has expired. Please sign in again.');
          });
        }, RETRY_INTERVAL);
      });
    }, timeUntilRefresh);
  }, [clearTimers, refreshUserSession]);

  // Initialize auth state from the server
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const { success, data } = await authService.getSession();
        
        if (success && data?.user) {
          setUser(data.user);
          setUserRole(data.user.role);
          setIsAuthenticated(true);
          
          // Set session expiry if available
          if (data.expiresAt) {
            const expiryDate = new Date(data.expiresAt);
            setSessionExpiry(expiryDate);
            scheduleTokenRefresh(expiryDate);
          } else {
            // If no expiry is provided, use the default refresh interval
            const defaultExpiry = new Date();
            defaultExpiry.setTime(defaultExpiry.getTime() + SESSION_REFRESH_INTERVAL);
            setSessionExpiry(defaultExpiry);
            scheduleTokenRefresh(defaultExpiry);
          }
        } else {
          // Clear state if no valid session
          setUser(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        errorLog('Error initializing auth:', error);
        // Clear auth state on error
        setUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
    
    // Clean up timers on unmount
    return () => {
      clearTimers();
    };
  }, [clearTimers, scheduleTokenRefresh]);

  // Listen for API response errors to detect auth issues
  useEffect(() => {
    const handleApiError = async (event: CustomEvent<any>) => {
      const { status, url } = event.detail;
      
      // Handle 401 Unauthorized errors 
      if (status === 401 && isAuthenticated && !url.includes('/api/auth/refresh')) {
        // Try to refresh the token
        const refreshed = await refreshUserSession();
        
        // Clear any redirect timeout that might have been set by the API client
        if ((window as any).__authRedirectTimeout) {
          clearTimeout((window as any).__authRedirectTimeout);
          (window as any).__authRedirectTimeout = null;
        }
        
        if (!refreshed) {
          // If refresh fails, sign out
          await signout();
          toast.error('Your session has expired. Please sign in again.');
        }
      }
    };
    
    // Register custom event listener
    window.addEventListener('api-error' as any, handleApiError as EventListener);
    
    return () => {
      window.removeEventListener('api-error' as any, handleApiError as EventListener);
    };
  }, [isAuthenticated, refreshUserSession]);

  const signin = async (email: string, password: string, role?: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { success, data, error } = await authService.signIn(email, password, role);
      
      if (!success || error) {
        toast.error(error?.message || 'Failed to sign in');
        return false;
      }

      if (data?.user) {
        setUser(data.user);
        setUserRole(data.user.role);
        setIsAuthenticated(true);
        
        // Set session expiry if available
        if (data.expiresAt) {
          const expiryDate = new Date(data.expiresAt);
          setSessionExpiry(expiryDate);
          scheduleTokenRefresh(expiryDate);
        } else {
          // If no expiry is provided, use the default refresh interval
          const defaultExpiry = new Date();
          defaultExpiry.setTime(defaultExpiry.getTime() + SESSION_REFRESH_INTERVAL);
          setSessionExpiry(defaultExpiry);
          scheduleTokenRefresh(defaultExpiry);
        }
        
        toast.success('Successfully signed in');
        return true;
      }

      return false;
    } catch (error) {
      errorLog('Error in signin:', error);
      toast.error('Something went wrong during sign in');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: any, role: UserRole): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log('Signing up user with data:', { ...userData, password: '[REDACTED]' });
      console.log('Using role:', role);
      
      const { success, data, error } = await authService.signUp(
        userData.email,
        userData.password,
        role,
        userData
      );

      if (!success || error) {
        console.error('Signup failed:', error);
        toast.error(error?.message || 'Failed to sign up');
        return false;
      }

      // Check if we have user and session data from the API response
      if (data?.user) {
        // Set user data in the context
        setUser(data.user);
        setUserRole(data.user.role);
        setIsAuthenticated(true);
        
        // If we have session data with expiry, set up session refresh
        if (data.session?.expiresAt) {
          const expiryDate = new Date(data.session.expiresAt);
          setSessionExpiry(expiryDate);
          scheduleTokenRefresh(expiryDate);
        } else {
          // If no expiry is provided, use the default refresh interval
          const defaultExpiry = new Date();
          defaultExpiry.setTime(defaultExpiry.getTime() + SESSION_REFRESH_INTERVAL);
          setSessionExpiry(defaultExpiry);
          scheduleTokenRefresh(defaultExpiry);
        }
        
        toast.success('Account created successfully!');
        
        // Redirect to the dashboard
        setTimeout(() => {
          const dashboardUrl = getDashboardUrlForRole(role);
          console.log(`Signup successful, redirecting to: ${dashboardUrl}`);
          
          // Use direct window.location navigation to avoid routing issues
          window.location.href = dashboardUrl.startsWith('/') ? dashboardUrl : `/${dashboardUrl}`;
        }, 500); // Short delay to allow the toast to show
        
        return true;
      }

      toast.success('Account created successfully! Please sign in.');
      return true;
    } catch (error) {
      errorLog('Error in signup:', error);
      console.error('Detailed signup error:', error);
      toast.error('Something went wrong during sign up');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Clear all timers to prevent further refresh attempts
      clearTimers();
      
      const { success, error } = await authService.signOut();
      
      if (!success || error) {
        toast.error(error?.message || 'Failed to sign out');
        return;
      }

      // Clear auth state
      setUser(null);
      setUserRole(null);
      setIsAuthenticated(false);
      setSessionExpiry(null);
      toast.success('Successfully signed out');
    } catch (error) {
      errorLog('Error in signout:', error);
      toast.error('Something went wrong during sign out');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const { success, error } = await authService.resetPassword(email);
      
      if (!success || error) {
        toast.error(error?.message || 'Failed to send reset password email');
        return false;
      }

      toast.success('Password reset email sent');
      return true;
    } catch (error) {
      errorLog('Error in resetPassword:', error);
      toast.error('Something went wrong while resetting password');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: any): Promise<boolean> => {
    try {
      setIsLoading(true);
      if (!user) return false;

      const { success, error } = await authService.updateProfile(user.id, userData);
      
      if (!success || error) {
        toast.error(error?.message || 'Failed to update profile');
        return false;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...userData } : null);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      errorLog('Error in updateProfile:', error);
      toast.error('Something went wrong while updating profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const redirectToDashboard = useCallback(() => {
    if (!isAuthenticated || !userRole) {
      console.error("Cannot redirect: User not authenticated or role not known");
      return;
    }
    
    const dashboardUrl = getDashboardUrlForRole(userRole);
    console.log(`Redirecting to dashboard: ${dashboardUrl}`);
    
    // Use window.location for a complete refresh rather than React Router navigation
    // Ensure the path has a leading slash
    window.location.href = dashboardUrl.startsWith('/') ? dashboardUrl : `/${dashboardUrl}`;
  }, [isAuthenticated, userRole, getDashboardUrlForRole]);

  // Add getFullName function
  const getFullName = useCallback(() => {
    if (!user) return '';
    return user.full_name || 'User';
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    userRole,
    isLoading,
    signin,
    signout,
    signup,
    resetPassword,
    updateProfile,
    getDashboardUrlForRole,
    refreshUserSession,
    redirectToDashboard,
    getFullName
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 