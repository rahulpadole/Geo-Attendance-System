import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: [
      'b49e27ac-6007-4b9b-adf6-83f2f119425f-00-2mf6dm6gqhckg.kirk.replit.dev',
      '.replit.dev'
    ],
    hmr: {
      port: 5000,
      host: '0.0.0.0',
      clientPort: 443,
      protocol: 'wss'
    },
    watch: {
      usePolling: true
    }
  }
})
