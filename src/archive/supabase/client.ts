/**
 * Supabase Client Compatibility Layer
 * 
 * This file provides a compatibility layer for code that still uses Supabase.
 * It redirects all calls to our new API client.
 * 
 * DEPRECATED: This file is for transitional support only and will be removed
 * once all components have been migrated to use the API client directly.
 */

import { api } from '@/lib/api';
import { errorLog, devLog } from '@/utils/environment';

class SupabaseCompatibilityClient {
  auth = {
    getUser: async () => {
      try {
        const response = await api.get('/api/auth/session');
        const data = await response.json();
        return { data: { user: data.user }, error: null };
      } catch (error) {
        errorLog('Error in getUser compatibility method:', error);
        return { data: { user: null }, error };
      }
    },
    
    getSession: async () => {
      try {
        const response = await api.get('/api/auth/session');
        const data = await response.json();
        return { 
          data: { 
            session: data.user ? {
              user: data.user,
              user_metadata: data.user
            } : null 
          }, 
          error: null 
        };
      } catch (error) {
        errorLog('Error in getSession compatibility method:', error);
        return { data: { session: null }, error };
      }
    }
  };

  from = (table: string) => {
    return {
      select: (columns: string = '*') => {
        return {
          eq: (column: string, value: any) => {
            return {
              single: async () => {
                try {
                  const response = await api.get(`/api/${table}?${column}=${value}&columns=${columns}`);
                  if (!response.ok) throw new Error(`Failed to fetch from ${table}`);
                  const data = await response.json();
                  return { data: data[0] || null, error: null };
                } catch (error) {
                  errorLog(`Error in from.select.eq.single compatibility method for ${table}:`, error);
                  return { data: null, error };
                }
              },
              order: (orderColumn: string, { ascending = true } = {}) => {
                return {
                  limit: async (limit: number) => {
                    try {
                      const order = ascending ? 'asc' : 'desc';
                      const response = await api.get(
                        `/api/${table}?${column}=${value}&columns=${columns}&orderBy=${orderColumn}&order=${order}&limit=${limit}`
                      );
                      if (!response.ok) throw new Error(`Failed to fetch from ${table}`);
                      const data = await response.json();
                      return { data, error: null };
                    } catch (error) {
                      errorLog(`Error in from.select.eq.order.limit compatibility method for ${table}:`, error);
                      return { data: null, error };
                    }
                  }
                };
              }
            };
          },
          gte: (column: string, value: any) => {
            return {
              order: (orderColumn: string, { ascending = true } = {}) => {
                return {
                  async get() {
                    try {
                      const order = ascending ? 'asc' : 'desc';
                      const response = await api.get(
                        `/api/${table}?${column}_gte=${value}&columns=${columns}&orderBy=${orderColumn}&order=${order}`
                      );
                      if (!response.ok) throw new Error(`Failed to fetch from ${table}`);
                      const data = await response.json();
                      return { data, error: null };
                    } catch (error) {
                      errorLog(`Error in from.select.gte.order.get compatibility method for ${table}:`, error);
                      return { data: null, error };
                    }
                  }
                };
              }
            };
          },
          async get() {
            try {
              const response = await api.get(`/api/${table}?columns=${columns}`);
              if (!response.ok) throw new Error(`Failed to fetch from ${table}`);
              const data = await response.json();
              return { data, error: null };
            } catch (error) {
              errorLog(`Error in from.select.get compatibility method for ${table}:`, error);
              return { data: null, error };
            }
          }
        };
      }
    };
  };
}

// Export the compatibility client instance
export const supabase = new SupabaseCompatibilityClient();

// Log deprecation warning
devLog('WARNING: Using deprecated Supabase compatibility layer. Please migrate to the API client.'); 