import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, '.', '');

  const config: any = {
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
    define: {},
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

  if (command === 'serve') {
    // Vitest configuration for testing
    config.test = {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: [
          'components/**/*.{ts,tsx}',
          'pages/**/*.{ts,tsx}',
          'types/**/*.{ts,tsx}',
        ],
        exclude: [
          '**/*.d.ts',
          '**/*.test.{ts,tsx}',
          '**/__tests__/**',
        ],
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
      include: ['**/*.test.{ts,tsx}', '**/__tests__/**'],
      exclude: ['node_modules', 'dist', '.idea', '.git', 'cypress'],
    };
  }

  return config;
});
