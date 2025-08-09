import { defineConfig } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      '@wharfkit/session',
      '@wharfkit/wallet-plugin-cloudwallet',
      '@wharfkit/antelope'
    ],
    esbuildOptions: {
      define: {
        Buffer: 'undefined'
      }
    }
  },
  resolve: {
    alias: {
      buffer: path.resolve(__dirname, 'src/bufferPolyfill.js')
    }
  },
  define: {
    Buffer: 'undefined'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false
      },
      '/aw-graphql': {
        target: 'https://api.alienworlds.io',
        changeOrigin: true,
        secure: false,
        rewrite: (p) => p.replace(/^\/aw-graphql/, '')
      }
    }
  }
});
