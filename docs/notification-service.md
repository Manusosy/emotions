# Notification Service Architecture

This document explains the notification service architecture implemented in the Emotions App as a replacement for Supabase's realtime subscriptions.

## Overview

The notification service provides a centralized mechanism for components to subscribe to real-time data updates without implementing their own polling logic. This improves performance, reduces code duplication, and provides consistent behavior across the application.

## Key Features

1. **Centralized Subscription Management**:
   - Single point of subscription to backend data
   - Automatic resource cleanup when components unmount

2. **Efficient Polling**:
   - Smart polling with visibility detection (pauses when tab is hidden)
   - Configurable polling intervals per resource
   - Automatic deduplication of subscriptions

3. **Event-Based Architecture**:
   - Publish-subscribe pattern for distributing updates
   - Multiple components can listen to the same data stream

4. **Resource-Specific APIs**:
   - Dedicated methods for common notification types
   - Standardized error handling

## Architecture

### Components

1. **NotificationService Class**:
   - Singleton instance that manages all subscriptions
   - Handles polling, event dispatch, and cleanup

2. **API Integration**:
   - Uses the application's API client for all requests
   - Integrates with error handling utilities

3. **Component Subscribers**:
   - React components that listen for updates
   - Register and unregister during their lifecycle

### Flow Diagram

```
┌─────────────────┐      Subscribe      ┌───────────────────┐
│                 │─────────────────────▶                   │
│  React Component│                     │ NotificationService│
│                 │◀─────────────────────                   │
└─────────────────┘    Notify Updates   └───────────────────┘
                                                  │
                                                  │ Poll
                                                  ▼
                                        ┌───────────────────┐
                                        │                   │
                                        │    API Client     │
                                        │                   │
                                        └───────────────────┘
                                                  │
                                                  │
                                                  ▼
                                        ┌───────────────────┐
                                        │                   │
                                        │   Backend API     │
                                        │                   │
                                        └───────────────────┘
```

## Usage

### Basic Subscription

```typescript
import { useEffect } from 'react';
import { notificationService } from '@/lib/notificationService';
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user } = useAuth();
  
  useEffect(() => {
    if (!user) return;
    
    // Subscribe to updates
    const subscriptionId = notificationService.subscribe(
      'resource_name',  // The resource to subscribe to
      user.id,          // The user ID 
      30000             // Optional: polling interval in ms (default: 30000)
    );
    
    // Add a listener to handle updates
    notificationService.addListener('resource_name', user.id, (data) => {
      // Handle the updated data
      console.log('Received update:', data);
    });
    
    // Clean up
    return () => {
      notificationService.unsubscribe(subscriptionId);
      notificationService.removeListener('resource_name', user.id, handleUpdate);
    };
  }, [user]);
  
  // ...
}
```

### Direct API Methods

For convenience, the notification service provides direct methods for common operations:

```typescript
// Get notifications
const { data, error } = await notificationService.getNotifications(userId);

// Mark a notification as read
await notificationService.markNotificationAsRead(notificationId);

// Mark all notifications as read
await notificationService.markAllNotificationsAsRead(userId);
```

## Supported Resources

The notification service supports these resource types:

1. `notifications` - User notifications
2. `journal_entries` - Journal entries
3. `mood_entries` - Mood tracking entries
4. `appointments` - User appointments

You can add additional resources by updating the `getEndpointForResource` method in the service.

## Best Practices

1. **Always clean up subscriptions** when components unmount to prevent memory leaks
2. **Use appropriate polling intervals** based on update frequency expectations
3. **Handle errors gracefully** in update listeners
4. **Avoid duplicate subscriptions** to the same resource

## Future Improvements

1. **WebSocket Support**: Replace polling with WebSockets for true real-time updates
2. **Offline Support**: Add offline caching and synchronization
3. **Batched Updates**: Group multiple updates together to reduce network traffic
4. **Selective Updates**: Allow subscribing to specific items within a resource

## Migration Guide

If your component is currently using direct polling:

1. Replace the interval-based polling with the notification service subscription
2. Remove manual fetch logic and use the listener pattern
3. Ensure proper cleanup on component unmount

### Before:

```typescript
useEffect(() => {
  const fetchData = async () => {
    const response = await api.get('/api/resource');
    setData(await response.json());
  };
  
  fetchData();
  const interval = setInterval(fetchData, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### After:

```typescript
useEffect(() => {
  if (!user) return;
  
  const fetchData = async () => {
    const { data, error } = await fetchWithErrorHandling(
      () => api.get('/api/resource'),
      { showErrorToast: false }
    );
    
    if (data && !error) {
      setData(data);
    }
  };
  
  fetchData(); // Initial fetch
  
  const subscriptionId = notificationService.subscribe('resource', user.id);
  notificationService.addListener('resource', user.id, (data) => {
    if (data) setData(data);
  });
  
  return () => {
    notificationService.unsubscribe(subscriptionId);
    notificationService.removeListener('resource', user.id, setData);
  };
}, [user]);
``` 