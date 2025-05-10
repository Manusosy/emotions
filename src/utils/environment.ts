/**
 * Environment Utilities
 * 
 * Helper functions to check the environment the app is running in.
 */

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

/**
 * Check if the application is running in production mode
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

/**
 * Check if the application is running in test mode
 */
export const isTest = (): boolean => {
  return process.env.NODE_ENV === 'test';
};

/**
 * Log message to console only in development mode
 */
export const devLog = (...args: any[]): void => {
  if (isDevelopment()) {
    console.log(...args);
  }
};

/**
 * Log error to console (in all environments)
 */
export const errorLog = (...args: any[]): void => {
  console.error(...args);
}; 