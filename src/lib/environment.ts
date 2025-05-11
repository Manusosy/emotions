// Environment variables helper for both server and client-side
// In browser environments, use import.meta.env (Vite's way of exposing env vars)
// In Node.js environments, use process.env

const getEnv = (key: string, defaultValue?: string): string => {
  // For Vite/browser environment
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteKey = `VITE_${key}`;
    return import.meta.env[viteKey] || defaultValue || '';
  }
  
  // For Node.js environment
  if (typeof process !== 'undefined' && process.env) {
    const nodeKey = key;
    return process.env[nodeKey] || defaultValue || '';
  }
  
  return defaultValue || '';
};

export const SUPABASE_URL = getEnv('SUPABASE_URL', 'https://crpvbznpatzymwfbjilc.supabase.co');
export const SUPABASE_KEY = getEnv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk'); 