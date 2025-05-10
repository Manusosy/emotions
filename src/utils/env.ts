/**
 * Environment variables utility
 * Provides type-safe access to environment variables
 */

// Import dotenv to load environment variables
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define environment variable types
interface Env {
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  RATE_LIMIT_WINDOW_MS: number;
  MAX_LOGIN_ATTEMPTS: number;
  NODE_ENV: 'development' | 'production' | 'test';
}

// Default values for environment variables
const defaultEnv: Env = {
  JWT_SECRET: 'development-secret-key-change-this-in-production',
  JWT_EXPIRY: '3600s', // 1 hour in seconds
  RATE_LIMIT_WINDOW_MS: 60000,
  MAX_LOGIN_ATTEMPTS: 5,
  NODE_ENV: 'development',
};

// Get environment variable with type safety and default value
function getEnv<K extends keyof Env>(key: K): Env[K] {
  const value = process.env[key];
  
  if (value === undefined) {
    console.warn(`Environment variable ${key} is not defined, using default value`);
    return defaultEnv[key];
  }
  
  // Type conversion based on default value type
  const defaultValue = defaultEnv[key];
  
  if (typeof defaultValue === 'number') {
    return Number(value) as Env[K];
  }
  
  return value as Env[K];
}

// Export individual environment variables
export const JWT_SECRET = getEnv('JWT_SECRET');
export const JWT_EXPIRY = getEnv('JWT_EXPIRY');
export const RATE_LIMIT_WINDOW_MS = getEnv('RATE_LIMIT_WINDOW_MS');
export const MAX_LOGIN_ATTEMPTS = getEnv('MAX_LOGIN_ATTEMPTS');
export const NODE_ENV = getEnv('NODE_ENV');

// Helper function to parse JWT expiry time
export function getJwtExpiryInSeconds(): number {
  const expiry = JWT_EXPIRY;
  // If expiry ends with 's', it's already in seconds
  if (expiry.endsWith('s')) {
    return parseInt(expiry.slice(0, -1), 10);
  }
  // If expiry ends with 'h', convert hours to seconds
  if (expiry.endsWith('h')) {
    return parseInt(expiry.slice(0, -1), 10) * 3600;
  }
  // If expiry ends with 'm', convert minutes to seconds
  if (expiry.endsWith('m')) {
    return parseInt(expiry.slice(0, -1), 10) * 60;
  }
  // If expiry ends with 'd', convert days to seconds
  if (expiry.endsWith('d')) {
    return parseInt(expiry.slice(0, -1), 10) * 86400;
  }
  // Default to parsing as seconds
  return parseInt(expiry, 10);
}

// Check if we're in development mode
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';

export default {
  JWT_SECRET,
  JWT_EXPIRY,
  RATE_LIMIT_WINDOW_MS,
  MAX_LOGIN_ATTEMPTS,
  NODE_ENV,
  isDevelopment,
  isProduction,
  isTest,
  getJwtExpiryInSeconds,
}; 