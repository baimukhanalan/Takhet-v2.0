import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  const geminiBrowserKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY || process.env.API_KEY || env.API_KEY || '';
  const geminiLiveModel = process.env.GEMINI_LIVE_MODEL || env.GEMINI_LIVE_MODEL || '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiBrowserKey),
      'process.env.API_KEY': JSON.stringify(geminiBrowserKey),
      'process.env.GEMINI_LIVE_MODEL': JSON.stringify(geminiLiveModel),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return;

            if (
              id.includes('/react/') ||
              id.includes('\\react\\') ||
              id.includes('react-dom') ||
              id.includes('react/jsx-runtime') ||
              id.includes('scheduler')
            ) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('motion')) return 'motion-vendor';
            if (id.includes('recharts')) return 'charts-vendor';
            if (id.includes('@google/genai')) return 'ai-vendor';
            if (id.includes('tus-js-client')) return 'upload-vendor';
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify: file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
