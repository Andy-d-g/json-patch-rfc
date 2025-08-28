import { defineProject } from "vitest/config";

/// <reference types="vitest" />
// https://vitejs.dev/config/
export default defineProject({
  test: {
    environment: "node",
    include: ["./src/__tests__/*.test.ts"]
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes("src/__tests__")) {
            return "exclude";
          }
        }
      }
    }
  }
});
