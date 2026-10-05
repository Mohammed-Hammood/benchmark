import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
],
  server: {
    port: 3000,
    // Same prefixes as nginx in production: the prefix is stripped and the
    // request is forwarded to the backend, so no CORS setup is needed.
    proxy: {
      '/go': {
        target: 'http://localhost:8081', // Go / Gin
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/go/, ''),
      },
      '/python': {
        target: 'http://localhost:8080', // Python / FastAPI
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/python/, ''),
      },
    },
  }
})
