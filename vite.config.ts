import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://zhnuksyh.github.io/sudotiles/ on GitHub Pages, so assets
// must resolve under the /sudotiles/ base. Local dev keeps the root base.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/sudotiles/' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    // The app, the kinetic-typography trailer, and the technique lessons are
    // independent HTML entries so they stay fully code-split: the game page
    // never downloads trailer or lesson code, and neither pulls the app in.
    // Reachable at /trailer/ and /learn/.
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        trailer: resolve(__dirname, 'trailer/index.html'),
        learn: resolve(__dirname, 'learn/index.html'),
      },
    },
  },
})
