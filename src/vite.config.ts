import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: '.', // Set root to current directory (src)
  publicDir: '../public', // Point to public directory in parent
  build: {
    outDir: '../dist', // Output to dist in parent
    emptyOutDir: true,
  },
  resolve: {
    alias: {
        '/src': resolve(__dirname, './') // Ensure /src imports work
    }
  }
})