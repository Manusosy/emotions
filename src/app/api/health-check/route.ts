import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Health check endpoint to verify API and database connectivity
 * This helps diagnose issues with the application's backend services
 */
export async function GET() {
  try {
    // Check database connection
    let dbConnected = false;
    
    try {
      // Try a simple query to verify database connectivity
      const count = await prisma.$queryRaw`SELECT 1 as check`;
      dbConnected = true;
    } catch (dbError) {
      console.error("Database connectivity check failed:", dbError);
      dbConnected = false;
    }
    
    // Return status information
    return NextResponse.json({ 
      status: "ok",
      timestamp: new Date().toISOString(),
      services: {
        api: true,
        database: dbConnected
      }
    });
  } catch (error) {
    console.error("Health check failed:", error);
    
    return NextResponse.json({ 
      status: "error",
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : "Unknown error",
      services: {
        api: true,
        database: false
      }
    }, { status: 500 });
  }
} 