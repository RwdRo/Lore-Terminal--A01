import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    include: [
      '@wharfkit/session',
      '@wharfkit/wallet-plugin-cloudwallet',
      '@wharfkit/antelope'
    ]
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
