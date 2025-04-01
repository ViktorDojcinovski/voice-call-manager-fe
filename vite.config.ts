import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "voice-javascript-sdk-quickstart-react",
  build: {
    outDir: "dist",
  },
});
