import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Relative base works on GitHub Pages (user or project site), Vercel, Netlify, etc.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 2000 },
})
