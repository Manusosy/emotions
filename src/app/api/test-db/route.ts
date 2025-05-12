import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * Simple database connectivity test endpoint
 * Tests direct connection to Supabase database with minimal overhead
 */
export async function GET() {
  try {
    console.log('Testing direct database connection...');
    
    // Try the most basic query possible
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      
      // Try to provide more details about the error
      return NextResponse.json({
        success: false,
        error: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        },
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }
    
    // Connection successful
    return NextResponse.json({
      success: true,
      database: 'connected',
      tables_tested: ['user_profiles'],
      results: data ? { count: data.length } : { count: 0 },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    // Unexpected error
    console.error('Unexpected error in database test:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        message: error.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 