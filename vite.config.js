import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-acacia.png'],
      manifest: {
        name: 'Acácia de Serra Negra 271',
        short_name: 'Acácia 271',
        description: 'Sistema de Gestão da Loja Maçônica Acácia de Serra Negra Nº 271',
        theme_color: '#1a237e',
        background_color: '#1a237e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/logo-acacia.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo-acacia.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
