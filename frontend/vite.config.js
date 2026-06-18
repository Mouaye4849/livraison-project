import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  define: {
    global: 'globalThis',
  },
  server: {
    host: true,
    https: true,
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
      // Proxy the SockJS/STOMP endpoint for web clients (browser).
      "/chat": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },

      // Proxy the raw WebSocket endpoint for React Native / mobile clients.
      // Without this, the Android device tries to reach :8080 directly, which
      // is blocked by Windows Firewall — the same reason /api goes through Vite.
      "/ws": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
      },

      // Proxy uploaded media files (images, audio) served by Spring Boot.
      // Without this, normalized URLs like http://IP:5173/uploads/audio_xxx.m4a
      // hit Vite's dev server which returns a 404 HTML page.
      // ExoPlayer receives HTML instead of audio data →
      // "None of the available extractors could read the stream".
      "/uploads": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    basicSsl(),
  ],
})
