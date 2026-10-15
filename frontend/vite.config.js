import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function removeBrowserOrigin(proxy) {
  proxy.on('proxyReq', (request) => request.removeHeader('origin'))
  proxy.on('proxyReqWs', (request) => request.removeHeader('origin'))
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react(), basicSsl()],
  server: {
    host: true, // Exposes the server to your local network (0.0.0.0)
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        configure: removeBrowserOrigin,
      },
      '/health': {
        target: 'http://localhost:3000',
        configure: removeBrowserOrigin,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
        configure: removeBrowserOrigin,
      },
    },
  },
})