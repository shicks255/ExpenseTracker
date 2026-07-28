import { defineConfig, loadEnv } from 'vite';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [
      tailwindcss(),
      react(),

      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
        manifest: {
          name: 'Expense Tracker',
          short_name: 'Expenses',
          description: 'Track and report personal expenses',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',

          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          navigateFallback: '/index.html',

          globPatterns: ['**/*.{js,css,html,ico,svg,woff,woff2}'],

          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'image',

              handler: 'CacheFirst',

              options: {
                cacheName: 'expense-tracker-images',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30,
                },
              },
            },
          ],
        },
      }),
    ],

    server: {
      proxy: {
        '/api': 'http://localhost:8181',
      },
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@ui': path.resolve(__dirname, './src/components/ui'),
      },
    },
  };

  // plugins: [tailwindcss(), react()],
  // server: {
  //   proxy: {
  //     '/api': 'http://localhost:8181',
  //   },
  // },
  // resolve: {
  //   alias: {
  //     '@': path.resolve(__dirname, './src'),
  //     '@ui': path.resolve(__dirname, './src/components/ui'),
  //   },
  // },
  // };
});
