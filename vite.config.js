import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { localApiMiddleware } from "./scripts/local-api-middleware.js";

export default defineConfig({
  plugins: [
    {
      name: "song-local-api",
      configureServer(server) {
        server.middlewares.use(localApiMiddleware());
      },
    },
    react(),
    tailwindcss(),
  ],
});
