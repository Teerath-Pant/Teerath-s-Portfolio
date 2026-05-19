import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The real Express backend handles all /api/* routes.
// In development, Vite proxies /api requests to the backend server.
// In production (Netlify), redirects/rewrites handle routing instead.

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5000,  // frontend runs on 5000
    cors: true,
    proxy: {
      // Forward all /api requests to the Express backend server
      '/api': {
        target: 'http://localhost:5002',  // backend runs on 5002
        changeOrigin: true,
      },
    },
  },
})
