import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    // The Firebase SDK (Auth + Firestore) is one ~570 kB (~170 kB gzip) vendor chunk.
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        // Stable vendor chunks: better long-term caching, and the charting code only
        // loads with the pages that need it.
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase)[\\/]/, priority: 30 },
            {
              name: 'charts',
              test: /node_modules[\\/](recharts|d3-[a-z-]+|victory-vendor|@reduxjs|redux|react-redux|reselect|immer|es-toolkit|decimal\.js-light|eventemitter3|internmap|tiny-invariant)[\\/]/,
              priority: 20,
            },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler|react-router)[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
});
