// vite.config.js
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
      },
    },
  },
  server: {
    port: 5173,

    // se usi subdomain su lvh.me, Vite può bloccare host non espliciti
    allowedHosts: ["localhost", "lvh.me", "test12.lvh.me"],

    proxy: {
      // AUTH (pubbliche)
      "/auth": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      // API (protette)
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      // RBAC (debug)
      "/rbac": {
        target: "http://localhost:5000",
        changeOrigin: true,
        secure: false,
      },

      // Socket.IO (handshake + ws)
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
