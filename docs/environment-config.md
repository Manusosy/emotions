# Environment Configuration Guide

This document provides information about environment configuration for the Emotions App after the authentication migration from Supabase to our custom cookie-based authentication system.

## Current Environment Variables

The application currently uses the following environment variables:

```
# Authentication
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRY=3600s

# API Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
MAX_LOGIN_ATTEMPTS=5

# Environment
NODE_ENV=development

# Legacy Supabase Variables (To be removed)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Updating the Environment Configuration

As part of the authentication migration cleanup, the Supabase-related environment variables should be removed. Here's how to update your configuration:

1. Create or update your `.env` file to remove the following variables:
   ```
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   ```

2. Ensure the following variables are properly set:
   ```
   JWT_SECRET=your-secure-jwt-secret
   JWT_EXPIRY=3600s
   RATE_LIMIT_WINDOW_MS=60000
   MAX_LOGIN_ATTEMPTS=5
   NODE_ENV=development
   ```

3. For production environments, make sure to:
   - Use a strong, unique JWT_SECRET
   - Set NODE_ENV=production
   - Consider adjusting JWT_EXPIRY and rate limiting parameters based on production needs

## Recommended New Variables

For future development, consider adding these variables to your environment configuration:

```
# API URL (for client-side requests)
VITE_API_URL=http://localhost:3000/api

# Feature Flags
VITE_ENABLE_OFFLINE_MODE=false
VITE_ENABLE_DEBUG_TOOLS=false

# Analytics
VITE_ENABLE_ANALYTICS=false
```

## Environment Configuration Best Practices

1. **Never commit sensitive values** to version control
2. Use a `.env.template` file to document required variables without their values
3. Use different environment files for different environments (`.env.development`, `.env.production`)
4. Validate environment variables at application startup
5. Document any changes to environment variables

## Legacy Code Considerations

Some parts of the codebase might still reference the Supabase environment variables. If you encounter any issues after removing these variables, check:

1. `src/lib/api.ts` - Should be updated to use the new authentication system
2. `src/utils/env.ts` - Should be updated to handle environment variables for the new system
3. Any remaining code in `src/integrations/supabase` - Should be archived or removed

## Accessing Environment Variables

The application uses a standardized approach to access environment variables through the `src/utils/env.ts` utility:

```typescript
import { getEnv } from '@/utils/env';

// Access environment variables with defaults
const apiUrl = getEnv('VITE_API_URL', 'http://localhost:3000/api');
const isProduction = getEnv('NODE_ENV') === 'production';
```

This approach provides type safety and consistent default values across the application. 