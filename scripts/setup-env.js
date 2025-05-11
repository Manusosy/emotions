/**
 * Environment setup script for the Emotions App
 * This script creates a .env file with secure configuration
 */
const fs = require('fs');
const path = require('path');

// Generate a secure random string for JWT secret
const generateSecret = () => {
  return require('crypto').randomBytes(64).toString('base64');
};

// Environment variables
const JWT_SECRET = generateSecret();
const TOKEN_EXPIRY = '1h'; // 1 hour

// Create .env file content
const envContent = `
# Authentication
JWT_SECRET=${JWT_SECRET}
TOKEN_EXPIRY=${TOKEN_EXPIRY}

# API Configuration
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3001

# Other Configuration
NODE_ENV=development
`.trim();

// Write to .env file
const envPath = path.join(__dirname, '..', '.env');
fs.writeFileSync(envPath, envContent);

console.log('✅ Environment setup complete!');
console.log('✅ Generated new JWT secret');
console.log('✅ Using 1-hour token expiry');
console.log('\n⚠️ IMPORTANT: Make sure your API server is running on port 3000 and WebSocket server on port 3001.'); 