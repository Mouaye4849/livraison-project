import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.removeHeader("origin");
            proxyReq.removeHeader("referer");
          });
        },
      },
      // Proxy the SockJS/STOMP endpoint so the browser makes a same-origin
      // request (no CORS) and no direct connection to :8080 is needed.
      "/chat": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,   // enable WebSocket upgrade proxying
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
})
