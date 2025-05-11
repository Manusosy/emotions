import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: false, // Allow Vite to try alternative ports if 5173 is in use
    hmr: {
      overlay: false, // Disable the error overlay
      clientPort: 5173, // Use this specific port for HMR
      timeout: 5000 // Add timeout to prevent hanging
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  // Reduce build invalidation frequency to prevent blinking
  optimizeDeps: {
    force: false
  }
});
