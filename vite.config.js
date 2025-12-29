import { defineConfig, loadEnv } from 'vite';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    optimizeDeps: {
      include: [
        '@wharfkit/session',
        '@wharfkit/wallet-plugin-cloudwallet',
        '@wharfkit/antelope',
      ],
      esbuildOptions: {
        define: {
          Buffer: 'undefined',
        },
      },
    },
    resolve: {
      alias: {
        buffer: path.resolve(__dirname, 'src/bufferPolyfill.js'),
      },
    },
    define: {
      Buffer: 'undefined',
    },
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: `http://localhost:${env.PORT || 5174}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
    },
  };
});