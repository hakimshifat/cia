import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  site: 'https://hakimshifat.github.io',
  base: '/cia',
  integrations: [
    AstroPWA({
      registerType: 'autoUpdate',
      base: '/cia/',
      scope: '/cia/',
      manifest: {
        name: 'Cyber Invasion Army',
        short_name: 'CIA',
        description: 'Cyber Invasion Army (CIA) CTF Team',
        theme_color: '#03030d',
        background_color: '#03030d',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        navigateFallback: '/cia/index.html',
        globPatterns: ['**/*.{css,js,html,svg,ico,txt}']
      }
    })
  ]
});
