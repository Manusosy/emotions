// Startup script to run both frontend and API server concurrently with improved reliability
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory where this script is located
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Counter for restart attempts
let frontendRestarts = 0;
let apiRestarts = 0;
const MAX_RESTARTS = 5;

// Process references
let frontendProcess = null;
let apiProcess = null;

// Start timestamp
const startTime = new Date();

/**
 * Format log messages with timestamps and colors
 */
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  let color = colors.white;
  
  switch (type) {
    case 'error':
      color = colors.red;
      break;
    case 'warning':
      color = colors.yellow;
      break;
    case 'success':
      color = colors.green;
      break;
    case 'frontend':
      color = colors.cyan;
      break;
    case 'api':
      color = colors.magenta;
      break;
    default:
      color = colors.white;
  }
  
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${color}${message}${colors.reset}`);
}

/**
 * Start the frontend development server
 */
function startFrontend() {
  log('Starting frontend development server...', 'frontend');
  
  // Use npm run dev for the frontend
  frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe', // Capture the process output
  });
  
  frontendProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      // Filter out noisy messages if needed
      if (line.trim()) {
        log(`[Frontend] ${line}`, 'frontend');
      }
    });
  });
  
  frontendProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      log(`[Frontend ERROR] ${line}`, 'error');
    });
  });
  
  frontendProcess.on('close', (code) => {
    log(`Frontend process exited with code ${code}`, code === 0 ? 'info' : 'error');
    
    // Attempt to restart if crashed
    if (code !== 0 && frontendRestarts < MAX_RESTARTS) {
      frontendRestarts++;
      log(`Restarting frontend (attempt ${frontendRestarts}/${MAX_RESTARTS})...`, 'warning');
      setTimeout(startFrontend, 2000); // Wait 2 seconds before restarting
    } else if (code !== 0) {
      log('Maximum frontend restart attempts reached. Please check the errors above.', 'error');
    }
  });
}

/**
 * Start the API server
 */
function startApiServer() {
  log('Starting API server...', 'api');
  
  // Use node to run server.js directly
  apiProcess = spawn('node', ['server.js'], {
    cwd: __dirname,
    shell: true,
    stdio: 'pipe', // Capture the process output
  });
  
  apiProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      log(`[API] ${line}`, 'api');
    });
  });
  
  apiProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      log(`[API ERROR] ${line}`, 'error');
    });
  });
  
  apiProcess.on('close', (code) => {
    log(`API process exited with code ${code}`, code === 0 ? 'info' : 'error');
    
    // Attempt to restart if crashed
    if (code !== 0 && apiRestarts < MAX_RESTARTS) {
      apiRestarts++;
      log(`Restarting API server (attempt ${apiRestarts}/${MAX_RESTARTS})...`, 'warning');
      setTimeout(startApiServer, 2000); // Wait 2 seconds before restarting
    } else if (code !== 0) {
      log('Maximum API restart attempts reached. Please check the errors above.', 'error');
    }
  });
}

/**
 * Clean exit handler
 */
function handleExit() {
  log('Shutting down services...', 'warning');
  
  // Calculate uptime
  const uptime = Math.round((new Date() - startTime) / 1000);
  log(`Total runtime: ${Math.floor(uptime / 60)}m ${uptime % 60}s`, 'info');
  
  // Kill processes if they're running
  if (frontendProcess) {
    frontendProcess.kill();
  }
  
  if (apiProcess) {
    apiProcess.kill();
  }
  
  // Allow some time for graceful shutdown
  setTimeout(() => {
    log('Exited cleanly.', 'success');
    process.exit(0);
  }, 1000);
}

// Set up clean exit handlers
process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);

// Print banner
console.log(`
${colors.bright}${colors.green}==============================================
  Emotions App - Development Server
==============================================
${colors.reset}
${colors.cyan}Frontend:${colors.reset} Vite development server (React + TypeScript)
${colors.magenta}Backend:${colors.reset} Express API server with Supabase DB

${colors.yellow}Press Ctrl+C to stop all services
${colors.reset}
`);

// Start both services
startFrontend();
startApiServer();

// Show status message
log('Both services are starting up. Please wait...', 'info');
log('The app will be available at http://localhost:5173 once ready', 'success'); 