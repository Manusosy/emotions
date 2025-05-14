// This is a modified version that works in both Next.js and Vite environments
export async function GET(req) {
  // Define response headers for better consistency and CORS
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept'
  };

  // Basic system information that doesn't depend on any external services
  const systemInfo = {
    environment: process.env.NODE_ENV || 'unknown',
    timestamp: new Date().toISOString()
  };
  
  // Create a standard compatible response object
  const response = new Response(
    JSON.stringify({
      status: 'ok',
      message: 'System check endpoint is operational',
      systemInfo
    }),
    { 
      status: 200,
      headers: headers
    }
  );
  
  return response;
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(req) {
  return new Response(null, { 
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
      'Access-Control-Max-Age': '86400'
    }
  });
} 