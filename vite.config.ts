import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Served from https://zhnuksyh.github.io/sudotiles/ on GitHub Pages, so assets
// must resolve under the /sudotiles/ base. Local dev keeps the root base.
// https://vite.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/sudotiles/' : '/',
  plugins: [react(), tailwindcss()],
})
