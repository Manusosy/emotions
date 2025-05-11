/**
 * Standardized Error Handling Utilities
 * 
 * This module provides a standardized approach to error handling across the application.
 * It includes utilities for handling API errors, form validation errors, and general
 * application errors.
 */

import { errorLog, devLog } from './environment';
import { toast } from 'sonner';

/**
 * Error type for API responses
 */
export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, any>;
  code?: string;
}

/**
 * Helper to determine if an error is an API error
 */
export function isApiError(error: any): error is ApiError {
  return error && typeof error === 'object' && 'status' in error && 'message' in error;
}

/**
 * Process API errors from Response objects
 */
export async function processApiError(response: Response): Promise<ApiError> {
  try {
    const errorData = await response.json();
    
    return {
      status: response.status,
      message: errorData.message || response.statusText,
      details: errorData.details,
      code: errorData.code
    };
  } catch {
    // If we can't parse the error as JSON, create a generic error
    return {
      status: response.status,
      message: response.statusText || 'Unknown error'
    };
  }
}

/**
 * Handle API errors consistently across the application
 */
export async function handleApiError(
  error: unknown, 
  defaultMessage: string = 'An error occurred', 
  showToast: boolean = true
): Promise<ApiError> {
  let apiError: ApiError;
  
  if (error instanceof Response) {
    apiError = await processApiError(error);
  } else if (error instanceof Error) {
    apiError = {
      status: 500,
      message: error.message || defaultMessage
    };
  } else if (isApiError(error)) {
    apiError = error;
  } else {
    apiError = {
      status: 500,
      message: defaultMessage
    };
  }
  
  // Log the error
  errorLog(`API Error (${apiError.status}):`, apiError.message, apiError.details);
  
  // Show toast notification if requested
  if (showToast) {
    toast.error(apiError.message || defaultMessage);
  }
  
  return apiError;
}

/**
 * Custom wrapper for API calls with standardized error handling
 */
export async function fetchWithErrorHandling<T>(
  fetcher: () => Promise<Response>,
  options: {
    defaultErrorMessage?: string;
    showErrorToast?: boolean;
    successMessage?: string;
    showSuccessToast?: boolean;
  } = {}
): Promise<{ data: T | null; error: ApiError | null }> {
  const {
    defaultErrorMessage = 'Failed to fetch data',
    showErrorToast = true,
    successMessage,
    showSuccessToast = false
  } = options;
  
  try {
    const response = await fetcher();
    
    if (!response.ok) {
      const apiError = await processApiError(response);
      if (showErrorToast) {
        toast.error(apiError.message || defaultErrorMessage);
      }
      return { data: null, error: apiError };
    }
    
    const data = await response.json() as T;
    
    if (showSuccessToast && successMessage) {
      toast.success(successMessage);
    }
    
    return { data, error: null };
  } catch (error) {
    const apiError = await handleApiError(error, defaultErrorMessage, showErrorToast);
    return { data: null, error: apiError };
  }
}

/**
 * Common HTTP status code handling with friendly messages
 */
export function getFriendlyErrorMessage(status: number): string {
  switch (status) {
    case 400:
      return 'The request was invalid. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You don\'t have permission to access this resource.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'There was a conflict with the current state of the resource.';
    case 422:
      return 'The provided data is invalid. Please check your input.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
      return 'An unexpected server error occurred. Please try again later.';
    case 503:
      return 'The service is temporarily unavailable. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Usage Example:
 * 
 * // In a component:
 * const fetchUserData = async () => {
 *   const { data, error } = await fetchWithErrorHandling<UserData>(
 *     () => api.get('/api/users/profile'),
 *     { 
 *       defaultErrorMessage: 'Failed to load user profile',
 *       successMessage: 'Profile loaded successfully',
 *       showSuccessToast: false
 *     }
 *   );
 *   
 *   if (error) {
 *     // Handle error (maybe set some error state)
 *     return;
 *   }
 *   
 *   // Use the data
 *   setUserData(data);
 * };
 */ 