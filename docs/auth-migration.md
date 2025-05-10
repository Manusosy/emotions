# Authentication Migration Guide

## Overview

This document explains the migration from Supabase-based authentication to our custom cookie-based authentication system. This migration addresses several key security concerns and architectural issues in the previous implementation.

## Key Changes

### 1. Authentication Storage

**Before**: Tokens were stored in `localStorage`, making them vulnerable to XSS attacks.
**After**: Tokens are stored in `HttpOnly` cookies, which cannot be accessed by JavaScript.

### 2. Authentication Flow

**Before**: Authentication state was managed by Supabase client and duplicated in local storage.
**After**: Authentication state is managed by a centralized `auth.service.ts` which handles token refreshing, login, and logout operations.

### 3. API Requests

**Before**: API requests were made directly to Supabase with JWT tokens from localStorage.
**After**: API requests use our API client which includes credentials for cookie-based authentication.

### 4. Type Consistency

**Before**: Inconsistent user role types (e.g., `moodMentor` vs `mood_mentor`).
**After**: Standardized user role types throughout the application.

### 5. Error Handling

**Before**: Inconsistent error handling patterns with direct console.log usage.
**After**: Standardized error handling utilities with environment-aware logging.

### 6. Real-time Updates

**Before**: Supabase's realtime subscriptions for real-time data.
**After**: Custom notification service with polling and eventual WebSocket support.

## Implementation Details

### Auth Service (`auth.service.ts`)

The core of our authentication system is now the `auth.service.ts` file, which provides:

- Cookie-based token storage
- Automatic token refresh
- Consistent authentication state management
- Type-safe user information

### API Client (`api.ts`)

The API client has been updated to:

- Include credentials in requests (`credentials: 'include'`)
- Handle authentication errors consistently
- Support token renewal

### Standardized Error Handling

A new error handling system provides consistent patterns:

- Environment-aware logging (`devLog`, `errorLog`)
- Standardized API error processing
- Easy-to-use `fetchWithErrorHandling` utility
- Friendly error messages for common HTTP status codes

### Notification Service

A replacement for Supabase's realtime subscriptions:

- Resource-based subscription model
- Efficient polling with pause/resume on tab visibility
- Support for multiple listeners
- Battery and performance optimizations

### Compatibility Layer

To ease the transition from Supabase to our custom auth system, we've created:

- A Supabase client compatibility layer at `src/integrations/supabase/client.ts`
- Updated service implementations for mood mentors, patients, and messages

## Components Updated

The following components have been updated to use the new authentication system:

1. `Auth.Provider.tsx` - Now uses our `auth.service.ts` instead of Supabase
2. `ProtectedRoute.tsx` - Simplified logic for route protection
3. `useAuth.ts` - Updated hook to work with our new auth service
4. `StressAssessmentModal.tsx` - Updated to use API client instead of Supabase
5. `HighlightedDoctors.tsx` - Updated to use moodMentorService instead of Supabase
6. `NotificationDropdown.tsx` - Removed localStorage dependencies and uses API client
7. `Profile.tsx` - Uses API client to fetch user profile data
8. `Settings.tsx` - Updated with improved error handling
9. `AppointmentsPage.tsx` - Uses API client and appointmentService
10. `MoodTrackerPage.tsx` - Updated to use API client for journal entries
11. `DashboardMoodAssessment.tsx` - Uses API client for mood entries
12. `JournalPage.tsx` - Uses API client and adds polling functionality

## Additional Services Created

1. `moodMentorService.ts` - Service for mood mentor related operations
2. `appointmentService.ts` - Service for appointment-related operations
3. `notificationService.ts` - Service for real-time updates and notifications
4. Error handling utilities for standardized error processing

## Remaining Tasks

- [ ] Refactor components to use new error handling utilities
- [ ] Update components to use notification service
- [ ] Implement automatic token refresh
- [ ] Add comprehensive error monitoring for production
- [ ] Add tests for authentication flows

## Security Considerations

The new authentication system offers several security improvements:

1. **XSS Protection**: By using HttpOnly cookies, tokens cannot be stolen via XSS attacks
2. **CSRF Protection**: The server validates requests to prevent CSRF attacks
3. **Token Refresh**: Automatic token refresh reduces the need for users to repeatedly log in
4. **Secure Logout**: Proper clearing of credentials on all devices

## Migration Path for Developers

When converting components from Supabase to our new auth system:

1. Replace `import { supabase } from "@/integrations/supabase/client"` with `import { api } from "@/lib/api"`
2. Convert Supabase query operations to API client calls
3. Replace `console.log` with `devLog` and `console.error` with `errorLog`
4. Use the compatibility layer temporarily if you cannot immediately refactor
5. Use the `fetchWithErrorHandling` utility for API requests
6. Replace Supabase realtime with notificationService subscriptions

## Troubleshooting

If you encounter issues during migration:

1. Check browser console for specific error messages
2. Verify that cookies are being properly set (check Application tab in DevTools)
3. Ensure API endpoints are correctly configured
4. Use the network tab to inspect request/response cycles for auth issues

---

For questions or assistance, please contact the development team. 