import { errorLog, devLog } from '@/utils/environment';

interface ApiOptions extends RequestInit {
  bypassAuth?: boolean;
  suppressErrorEvent?: boolean; // Option to suppress the error event for certain requests
}

/**
 * Custom API Error event
 */
export class ApiErrorEvent extends CustomEvent<{
  status: number;
  url: string;
  method: string;
  message: string;
}> {
  constructor(detail: { status: number; url: string; method: string; message: string }) {
    super('api-error', { detail, bubbles: true });
  }
}

/**
 * API Client
 * 
 * Handles all HTTP requests with consistent error handling,
 * authentication, and response formatting.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Emits an API error event for auth-related monitoring
   */
  private emitErrorEvent(status: number, url: string, method: string, message: string) {
    const event = new ApiErrorEvent({
      status,
      url,
      method,
      message
    });
    
    window.dispatchEvent(event);
    devLog(`API Error (${status}): ${message}`, { url, method });
  }

  private async request(endpoint: string, options: ApiOptions = {}) {
    // Set up default headers and credentials
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Include credentials to send/receive cookies
    const config: RequestInit = {
      ...options,
      headers,
      credentials: 'include', // Important: This enables sending cookies with requests
    };

    try {
      console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
        // Log the request body but redact sensitive information
        const body = options.body ? JSON.parse(options.body as string) : {};
        const redactedBody = { ...body };
        if (redactedBody.password) redactedBody.password = '[REDACTED]';
        if (redactedBody.confirmPassword) redactedBody.confirmPassword = '[REDACTED]';
        console.log('Request payload:', redactedBody);
      }
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      console.log(`API Response: ${options.method || 'GET'} ${endpoint} - Status: ${response.status}`);
      
      // If we receive an error response, emit an error event
      if (!response.ok && !options.suppressErrorEvent) {
        // Get error message if possible
        let errorMessage = 'API request failed';
        let errorData;
        try {
          errorData = await response.clone().json();
          errorMessage = errorData.message || `${response.status}: ${response.statusText}`;
          console.error('API Error Data:', errorData);
        } catch (e) {
          errorMessage = `${response.status}: ${response.statusText}`;
          console.error('Could not parse error response as JSON');
        }
        
        // Emit the error event
        this.emitErrorEvent(response.status, endpoint, options.method || 'GET', errorMessage);
      }
      
      // Handle 401 Unauthorized 
      if (response.status === 401 && !options.bypassAuth) {
        // For token refresh and login endpoints, don't redirect
        const isAuthEndpoint = endpoint.includes('/api/auth/login') || 
                                endpoint.includes('/api/auth/refresh') ||
                                endpoint.includes('/api/auth/session');
        
        if (!isAuthEndpoint) {
          // If the auth hook doesn't handle this within a moment, redirect to login
          const redirectTimeout = setTimeout(() => {
            // Store the current location to redirect back after login
            const currentPath = window.location.pathname + window.location.search;
            window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
          }, 2000);
          
          // Store the timeout in window so the auth hook can clear it if it handles the 401
          (window as any).__authRedirectTimeout = redirectTimeout;
          
          throw new Error('Authentication required');
        }
      }

      // Handle 403 Forbidden (permission issues)
      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({
          message: 'You do not have permission to access this resource'
        }));
        throw new Error(errorData.message || 'Access forbidden');
      }

      // Handle 404 Not Found
      if (response.status === 404) {
        console.error(`Resource not found: ${endpoint}`);
        throw new Error('Resource not found');
      }

      // Handle 500 and other server errors
      if (response.status >= 500) {
        console.error(`Server error (${response.status}): ${endpoint}`);
        throw new Error('Server error. Please try again later.');
      }

      // Handle other error statuses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          message: 'An unexpected error occurred'
        }));
        
        console.error(`API error (${response.status}): ${errorData.message}`);
        throw new Error(errorData.message || `API request failed: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      errorLog(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint: string, options: ApiOptions = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint: string, data?: any, options: ApiOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put(endpoint: string, data?: any, options: ApiOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch(endpoint: string, data?: any, options: ApiOptions = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete(endpoint: string, options: ApiOptions = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient(); 