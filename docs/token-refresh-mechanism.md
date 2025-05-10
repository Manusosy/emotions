# Automatic Token Refresh Mechanism

This document explains how the automatic token refresh mechanism works in the Emotions App authentication system.

## Overview

To improve security and user experience, we've implemented an automatic token refresh mechanism that:

1. Automatically refreshes tokens before they expire
2. Handles 401 Unauthorized errors by attempting to refresh the token
3. Provides fallback mechanisms to gracefully handle failed refreshes
4. Prevents race conditions during token refresh

## How It Works

### Token Lifecycle

1. **Token Acquisition**: When a user logs in, the server sets an HttpOnly cookie containing their authentication token
2. **Token Expiry Management**: The auth provider tracks when the token will expire
3. **Proactive Refresh**: The system schedules token refresh 2 minutes before expiry
4. **Reactive Refresh**: Any 401 errors trigger an immediate token refresh attempt

### Components Involved

#### 1. Auth Service (`auth.service.ts`)

- Handles the communication with the authentication API endpoints
- Provides the `refreshToken()` method for refreshing the authentication token

#### 2. Auth Provider (`use-auth.tsx`)

- Manages the token refresh timers using `useRef` to prevent memory leaks
- Schedules token refresh before expiry
- Handles retry logic when a refresh fails
- Listens for API error events to detect 401 errors and trigger refreshes

#### 3. API Client (`api.ts`)

- Emits custom `api-error` events when receiving error responses
- Provides a delayed redirect to login for 401 errors, giving the auth provider time to refresh the token
- Supports special options for authentication-related endpoints

## Implementation Details

### Refresh Timing

- **Buffer Time**: Tokens are refreshed 2 minutes before expiry (`REFRESH_BUFFER_TIME`)
- **Retry Interval**: Failed refreshes are retried after 30 seconds (`RETRY_INTERVAL`)

### Error Handling

1. **First Refresh Attempt**: When a token is close to expiry or a 401 error is detected
2. **Retry Mechanism**: If the first attempt fails, schedule a retry after 30 seconds
3. **Fallback**: If the retry also fails, sign out the user and show a notification

### Race Condition Prevention

- Uses `isRefreshingRef` to track if a refresh is in progress
- Prevents multiple simultaneous refresh attempts

### Token Expiry Tracking

- Server returns `expiresAt` timestamp with successful authentication/refresh responses
- Auth provider stores this in `sessionExpiry` state
- If no explicit expiry is provided, defaults to SESSION_REFRESH_INTERVAL (15 minutes)

## Usage by Developers

Developers should not need to handle token refreshes manually. The system automatically:

1. Refreshes tokens before they expire
2. Retries failed refreshes
3. Handles 401 errors by refreshing the token
4. Redirects to login only when authentication truly fails

If you need to manually trigger a token refresh (rare case), you can use:

```typescript
const { refreshUserSession } = useAuth();
await refreshUserSession();
```

## Troubleshooting

If you encounter authentication issues:

1. Check browser dev tools for API error events
2. Verify that the cookie is being set correctly
3. Check for any console errors related to token refresh
4. Ensure the server-side token verification is working correctly

## Security Considerations

- Tokens are stored as HttpOnly cookies to prevent XSS attacks
- Refresh attempts use proper error handling and rate limiting
- Failed refresh attempts eventually sign out the user rather than retrying indefinitely