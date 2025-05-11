/**
 * Environment Utilities
 * 
 * Helper functions to check the environment the app is running in.
 */

/**
 * Get the current environment
 */
export const getEnvironment = (): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.MODE || 'development';
  }
  
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV || 'development';
  }
  
  return 'development';
};

/**
 * Check if the application is running in development mode
 */
export const isDevelopment = (): boolean => {
  return getEnvironment() === 'development';
};

/**
 * Check if the application is running in production mode
 */
export const isProduction = (): boolean => {
  return getEnvironment() === 'production';
};

/**
 * Check if the application is running in test mode
 */
export const isTest = (): boolean => {
  return getEnvironment() === 'test';
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