/**
 * Run the application with environment variables
 */
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get current directory in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to .env file
const envPath = join(__dirname, '..', '.env');

// Check if .env file exists
if (!existsSync(envPath)) {
  console.log('❌ Environment file (.env) not found. Creating one...');
  try {
    // Run setup-env script
    const setup = spawnSync('node', [join(__dirname, 'setup-env.js')], { 
      stdio: 'inherit',
      shell: true 
    });
    
    if (setup.status !== 0) {
      console.error('❌ Failed to create environment file. Exiting...');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error running setup-env script:', error.message);
    process.exit(1);
  }
}

// Get command to run from arguments or default to 'dev'
const command = process.argv[2] || 'dev';

console.log(`🚀 Running '${command}' with environment variables...`);

// Run the actual command
try {
  const result = spawnSync('npm', ['run', command], { 
    stdio: 'inherit',
    shell: true,
    env: { ...process.env }
  });
  
  process.exit(result.status || 0);
} catch (error) {
  console.error(`❌ Error running '${command}':`, error.message);
  process.exit(1);
} 