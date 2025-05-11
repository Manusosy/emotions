/**
 * Notification Service
 * 
 * This service handles real-time notifications and data updates
 * as a replacement for Supabase's realtime subscriptions.
 */

import { api } from './api';
import { errorLog, devLog } from '@/utils/environment';
import { fetchWithErrorHandling } from '@/utils/error-handling';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'welcome' | 'update' | 'reminder' | 'message' | 'system' | 'other';
  read: boolean;
  created_at: string;
  action_url?: string;
  user_id: string;
}

// Singleton pattern for notification polling
class NotificationService {
  private pollingIntervals: Record<string, number> = {};
  private listeners: Record<string, Function[]> = {};
  private isInitialized = false;
  
  /**
   * Initialize the notification service
   */
  initialize(): void {
    if (this.isInitialized) return;
    
    // Initialize visibility change listener to pause/resume polling when tab is hidden
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.isInitialized = true;
    devLog('Notification service initialized');
  }
  
  /**
   * Clean up resources when the service is no longer needed
   */
  cleanup(): void {
    // Clear all polling intervals
    Object.values(this.pollingIntervals).forEach(interval => {
      window.clearInterval(interval);
    });
    
    // Remove visibility change listener
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    
    this.pollingIntervals = {};
    this.listeners = {};
    this.isInitialized = false;
    
    devLog('Notification service cleaned up');
  }
  
  /**
   * Handle visibility change to pause/resume polling
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      devLog('Tab hidden, pausing notification polling');
      // Pause all polling when tab is hidden to save resources
      Object.entries(this.pollingIntervals).forEach(([key, interval]) => {
        window.clearInterval(interval);
        this.pollingIntervals[key] = -1; // Mark as paused
      });
    } else {
      devLog('Tab visible, resuming notification polling');
      // Resume polling when tab becomes visible again
      Object.entries(this.pollingIntervals).forEach(([key, interval]) => {
        if (interval === -1) {
          const [resource, userId] = key.split(':');
          this.subscribe(resource, userId);
        }
      });
    }
  };
  
  /**
   * Subscribe to updates for a specific resource
   * @param resource The resource to subscribe to (e.g., 'notifications', 'journal_entries')
   * @param userId The user ID to filter updates for
   * @param pollingInterval How often to check for updates (in milliseconds)
   * @returns A subscription ID that can be used to unsubscribe
   */
  subscribe(resource: string, userId: string, pollingInterval: number = 30000): string {
    if (!this.isInitialized) {
      this.initialize();
    }
    
    const subscriptionId = `${resource}:${userId}`;
    
    // Clear existing interval if any
    if (this.pollingIntervals[subscriptionId]) {
      window.clearInterval(this.pollingIntervals[subscriptionId]);
    }
    
    // Set up polling for the resource
    const intervalId = window.setInterval(() => {
      this.fetchUpdates(resource, userId);
    }, pollingInterval);
    
    this.pollingIntervals[subscriptionId] = intervalId;
    
    // Trigger initial fetch
    this.fetchUpdates(resource, userId);
    
    devLog(`Subscribed to ${resource} updates for user ${userId}`);
    return subscriptionId;
  }
  
  /**
   * Unsubscribe from updates
   * @param subscriptionId The subscription ID returned from subscribe()
   */
  unsubscribe(subscriptionId: string): void {
    if (this.pollingIntervals[subscriptionId]) {
      window.clearInterval(this.pollingIntervals[subscriptionId]);
      delete this.pollingIntervals[subscriptionId];
      
      devLog(`Unsubscribed from ${subscriptionId}`);
    }
  }
  
  /**
   * Fetch updates for a specific resource
   * @param resource The resource to fetch updates for
   * @param userId The user ID to filter updates for
   */
  private async fetchUpdates(resource: string, userId: string): Promise<void> {
    try {
      const endpoint = this.getEndpointForResource(resource, userId);
      
      const { data, error } = await fetchWithErrorHandling<any>(
        () => api.get(endpoint),
        { 
          showErrorToast: false // Don't show error toasts for background polling
        }
      );
      
      if (error) {
        if (error.status !== 304) { // Ignore 304 Not Modified
          errorLog(`Error fetching ${resource} updates:`, error);
        }
        return;
      }
      
      // Only notify listeners if we got data
      if (data) {
        this.notifyListeners(resource, userId, data);
      }
    } catch (error) {
      errorLog(`Error in fetchUpdates for ${resource}:`, error);
    }
  }
  
  /**
   * Get the API endpoint for a specific resource
   */
  private getEndpointForResource(resource: string, userId: string): string {
    switch (resource) {
      case 'notifications':
        return `/api/notifications?userId=${userId}`;
      case 'journal_entries':
        return `/api/journal-entries?userId=${userId}`;
      case 'mood_entries':
        return `/api/mood-entries?userId=${userId}`;
      case 'appointments':
        return `/api/appointments?userId=${userId}`;
      // Add support for conversation messages
      case resource.match(/^conversation_(.+)$/)?.input:
        const conversationId = resource.replace('conversation_', '');
        return `/api/conversations/${conversationId}/messages`;
      default:
        return `/api/${resource}?userId=${userId}`;
    }
  }
  
  /**
   * Add a listener for updates to a resource
   * @param resource The resource to listen for updates to
   * @param userId The user ID to filter updates for
   * @param callback The function to call when updates are received
   */
  addListener(resource: string, userId: string, callback: Function): void {
    const key = `${resource}:${userId}`;
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    
    this.listeners[key].push(callback);
    devLog(`Added listener for ${key}`);
  }
  
  /**
   * Remove a listener
   * @param resource The resource the listener was added for
   * @param userId The user ID the listener was added for
   * @param callback The callback function to remove
   */
  removeListener(resource: string, userId: string, callback: Function): void {
    const key = `${resource}:${userId}`;
    if (this.listeners[key]) {
      this.listeners[key] = this.listeners[key].filter(listener => listener !== callback);
      devLog(`Removed listener for ${key}`);
    }
  }
  
  /**
   * Notify all listeners for a resource
   * @param resource The resource that was updated
   * @param userId The user ID the update is for
   * @param data The updated data
   */
  private notifyListeners(resource: string, userId: string, data: any): void {
    const key = `${resource}:${userId}`;
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          errorLog(`Error in listener callback for ${key}:`, error);
        }
      });
    }
  }
  
  /**
   * Fetch user notifications
   * @param userId The user ID to fetch notifications for
   * @param limit Maximum number of notifications to fetch
   */
  async getNotifications(userId: string, limit: number = 10): Promise<{ data: Notification[] | null; error: any }> {
    return fetchWithErrorHandling<Notification[]>(
      () => api.get(`/api/notifications?userId=${userId}&limit=${limit}`),
      { defaultErrorMessage: 'Failed to fetch notifications' }
    );
  }
  
  /**
   * Mark a notification as read
   * @param notificationId The ID of the notification to mark as read
   */
  async markNotificationAsRead(notificationId: string): Promise<{ success: boolean; error: any }> {
    const { data, error } = await fetchWithErrorHandling<{ success: boolean }>(
      () => api.put(`/api/notifications/${notificationId}/read`, { read: true }),
      { defaultErrorMessage: 'Failed to mark notification as read', showErrorToast: false }
    );
    
    return { 
      success: data?.success || false, 
      error 
    };
  }
  
  /**
   * Mark all notifications as read
   * @param userId The user ID to mark all notifications as read for
   * @param notificationIds Optional array of specific notification IDs to mark as read
   */
  async markAllNotificationsAsRead(userId: string, notificationIds?: string[]): Promise<{ success: boolean; error: any }> {
    const { data, error } = await fetchWithErrorHandling<{ success: boolean }>(
      () => api.put('/api/notifications/mark-all-read', { 
        userId,
        ids: notificationIds 
      }),
      { defaultErrorMessage: 'Failed to mark notifications as read' }
    );
    
    return { 
      success: data?.success || false, 
      error 
    };
  }
}

// Export a singleton instance
export const notificationService = new NotificationService(); 