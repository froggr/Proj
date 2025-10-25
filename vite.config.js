import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // Main process entry point
        entry: 'electron/main.js',
      },
      {
        // Preload script
        entry: 'electron/preload.js',
        onstart(options) {
          // Notify the Renderer process to reload the page when the Preload scripts build is complete
          options.reload()
        },
      },
    ]),
    renderer(),
  ],
  server: {
    port: 5173, // Standard Vite port
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
  },
})
