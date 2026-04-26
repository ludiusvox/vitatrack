import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Change to http://localhost:3000 if your backend runs on that port
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
