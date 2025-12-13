// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true
      }
    }
  },
  server: {
    port: 5173,

    proxy: {
      // AUTH
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },

      // API PROTETTE
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      },

      // (opzionale) RBAC – solo per debug
      "/rbac": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false
      }
    }
  }
})
