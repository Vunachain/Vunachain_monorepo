import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '127.0.0.1',
      cors: true,
      proxy: {
        '/admin': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/static/admin': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/static/jazzmin': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/static/vendor': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        },
        '/api': {
          target: 'http://localhost:8000',
          changeOrigin: true,
        }
      }
    },
    optimizeDeps: {
      include: ['mapbox-gl'],
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion'],
            ui: ['@rainbow-me/rainbowkit', 'lucide-react', 'clsx', 'tailwind-merge'],
            web3: ['viem', 'wagmi', '@tanstack/react-query']
          }
        }
      }
    }
  };
});
