import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    hmr: {
      port: 5000,
      host: '0.0.0.0'
    },
    watch: {
      usePolling: true,
      interval: 1000
    }
  }
})
