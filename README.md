# Emotions App

A modern mental health application that helps users track and manage their emotions, connect with mood mentors, and access mental health resources.

## Features

- User authentication with secure cookie-based tokens
- Emotion tracking and journaling
- Mood mentor connections and appointment scheduling
- Dashboard for patients and mood mentors
- Stress assessments and mental health resources

## Recent Changes: Authentication Migration

We've recently migrated from Supabase authentication to a custom cookie-based authentication system. This migration addresses several security concerns and architectural issues in the previous implementation.

Key improvements:
- Enhanced security with HttpOnly cookies instead of localStorage
- Centralized authentication state management
- Consistent API client for data fetching
- Type consistency throughout the application
- Better error handling with environment-aware logging
- Standardized notification system replacing Supabase realtime

For detailed information about the authentication changes, see [auth-migration.md](docs/auth-migration.md).

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/emotions-app.git
cd emotions-app
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Project Structure

- `src/` - Application source code
  - `components/` - Reusable UI components
  - `features/` - Feature-specific components and logic
  - `hooks/` - Custom React hooks
  - `lib/` - Core utilities and services
  - `integrations/` - Third-party integrations
  - `types/` - TypeScript type definitions
  - `utils/` - Utility functions

## Authentication System

The application uses a cookie-based authentication system with the following components:

- `auth.service.ts` - Core authentication service with login/logout functionality
- `api.ts` - API client for making authenticated requests
- `Auth.Provider.tsx` - React context provider for authentication state
- `useAuth.ts` - Hook for accessing authentication state and methods
- `error-handling.ts` - Standardized error handling utilities
- `notificationService.ts` - Service for real-time updates

## Development

### Code Style

We use ESLint and Prettier for code formatting and linting. Run the following commands to ensure code quality:

```bash
# Lint the code
npm run lint

# Format the code
npm run format
```

### Building for Production

```bash
npm run build
# or
yarn build
```

This will create an optimized production build in the `dist/` directory.

## License

[MIT](LICENSE)
