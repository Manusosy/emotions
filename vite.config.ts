import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tsconfigPaths()],
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
