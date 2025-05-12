import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tsconfigPaths(),
    {
      name: 'generate-200-html',
      closeBundle() {
        // Copy index.html to 200.html for SPA routing
        if (process.env.NODE_ENV === 'production') {
          try {
            const indexHtml = fs.readFileSync('dist/index.html', 'utf8');
            fs.writeFileSync('dist/200.html', indexHtml);
            console.log('Created 200.html for Vercel SPA routing');
          } catch (error) {
            console.error('Error creating 200.html:', error);
          }
        }
      }
    }
  ],
  server: {
    port: 5173,
    strictPort: false, // Allow Vite to try alternative ports if 5173 is in use
    hmr: {
      overlay: false, // Disable the error overlay
      clientPort: 5173, // Use this specific port for HMR
      timeout: 5000 // Add timeout to prevent hanging
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Change this if your API server runs on a different port
        changeOrigin: true,
        rewrite: (path) => path, // Don't rewrite paths
        secure: false, // Allow self-signed certificates in dev
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Proxy response:', proxyRes.statusCode, req.url);
          });
        }
      }
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
  },
  // Define base environment variables
  define: {
    // Ensure environment variables are correctly passed to the client
    'import.meta.env.VITE_ENABLE_DIAGNOSTICS': 
      JSON.stringify(process.env.VITE_ENABLE_DIAGNOSTICS || 'false')
  }
});
