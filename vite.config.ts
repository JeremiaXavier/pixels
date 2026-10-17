import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache', 'tests/e2e/**'],
  },
  worker: {
    format: 'es',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          lucide: ['lucide-react'],
          archive: ['jszip', 'idb'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
