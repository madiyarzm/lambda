import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In dev, the React app runs on :5173 and the FastAPI backend on :8000.
// Proxying /api, /health, and /ws through Vite makes the browser see
// everything as same-origin, which is what httpOnly cookies need to work
// without CORS gymnastics (the production deployment is naturally
// same-origin since FastAPI serves the built frontend).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
