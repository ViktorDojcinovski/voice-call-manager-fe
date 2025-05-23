import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === "production" ? "/voice-call-manager-fe/" : "/",
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/socket.io": {
        target:
          process.env.NODE_ENV === "production"
            ? "https://p1.echo-o.com"
            : "http://localhost:3000",
        ws: true,
      },
    },
  },
});
