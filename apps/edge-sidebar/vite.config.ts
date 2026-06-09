import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, "sidepanel.html"),
        background: resolve(__dirname, "src/background.ts"),
        contentScript: resolve(__dirname, "src/contentScript.ts")
      },
      output: {
        entryFileNames: (chunk) =>
          chunk.name === "background"
            ? "assets/background.js"
            : chunk.name === "contentScript"
              ? "assets/content-script.js"
              : "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  test: {
    environment: "node",
    setupFiles: ["./src/test-setup.ts"]
  }
});
