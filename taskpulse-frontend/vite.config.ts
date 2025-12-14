// taskpulse-frontend/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Чтобы запросы вида /api/... с localhost:5173
  // автоматически проксировались на Django (8000).
  // Это исправляет 404 на :5173 для /api/integrations/telegram/link-start/ и т.п.
  server: {
    proxy: {
      "/api": {
        // ЛОКАЛЬНАЯ разработка (самый частый кейс)
        target: "http://localhost:8000",
        changeOrigin: true,
        secure: false,
      },

      // Если у тебя в dev реально бек на домене (а не localhost),
      // просто замени target на:
      // target: "http://pulse-zone.tech:8000",
    },
  },
});
