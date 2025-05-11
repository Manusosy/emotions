/**
 * Supabase Client Configuration
 * 
 * This file initializes the Supabase client with the proper credentials
 * and exports it for use throughout the application.
 */
import { createClient } from '@supabase/supabase-js';
import { devLog } from '@/utils/environment';

// Supabase project configuration
const supabaseUrl = 'https://crpvbznpatzymwfbjilc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycHZiem5wYXR6eW13ZmJqaWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MTYwMDQsImV4cCI6MjA2MjM5MjAwNH0.PHTIhaf_7PEICQHrGDm9mmkMtznGDvIEWmTWAmRfFEk';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Log initialization
devLog('Supabase client initialized'); 