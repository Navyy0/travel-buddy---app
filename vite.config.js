import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Proxy backend API calls to avoid CORS and mixed-content errors during dev.
    // This forwards requests from the dev server (same origin) to your
    // backend running on localhost:8000. Adjust paths as needed.
    proxy: {
      '/auth': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      },
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})
