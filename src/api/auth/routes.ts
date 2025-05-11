import { NextRequest, NextResponse } from 'next/server';
import {
  validateToken,
  patientLogin,
  mentorLogin,
  patientRegister,
  mentorRegister,
  logout,
  forgotPassword,
  resetPassword
} from './handlers';

// Authentication route handlers
export async function handleAuthRoute(req: NextRequest, route: string) {
  try {
    // Extract path parts
    const parts = route.split('/');
    const action = parts[parts.length - 1];
    
    console.log(`[Auth Route Handler] Processing route: ${route}, action: ${action}`);
    
    // Handle different routes based on method and path
    switch (req.method) {
      case 'GET':
        if (action === 'validate') {
          return validateToken(req);
        }
        break;
        
      case 'POST':
        if (action === 'login') {
          if (parts.includes('patient')) {
            console.log('[Auth Route Handler] Routing to patient login');
            return patientLogin(req);
          } else if (parts.includes('mentor') || parts.includes('moodMentor') || parts.includes('mood_mentor')) {
            console.log('[Auth Route Handler] Routing to mentor login');
            return mentorLogin(req);
          }
        } else if (action === 'register') {
          if (parts.includes('patient')) {
            console.log('[Auth Route Handler] Routing to patient registration');
            return patientRegister(req);
          } else if (parts.includes('mentor') || parts.includes('moodMentor') || parts.includes('mood_mentor')) {
            console.log('[Auth Route Handler] Routing to mentor registration');
            return mentorRegister(req);
          }
        } else if (action === 'logout') {
          return logout(req);
        } else if (action === 'forgot-password') {
          return forgotPassword(req);
        } else if (action === 'reset-password') {
          return resetPassword(req);
        }
        break;
        
      default:
        console.log(`[Auth Route Handler] Method not allowed: ${req.method}`);
        return NextResponse.json({ message: 'Method not allowed' }, { status: 405 });
    }
    
    // If no route matched
    console.log(`[Auth Route Handler] Route not found: ${route}`);
    return NextResponse.json({ message: 'Route not found', route }, { status: 404 });
  } catch (error) {
    console.error('[Auth Route Handler] Route handler error:', error);
    return NextResponse.json({ message: 'An error occurred', error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 