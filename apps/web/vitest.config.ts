import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@vrsoc/types": path.resolve(__dirname, "../../packages/types/src"),
      "@vrsoc/validation": path.resolve(__dirname, "../../packages/validation/src"),
      "@vrsoc/config": path.resolve(__dirname, "../../packages/config/src"),
      "@vrsoc/ui": path.resolve(__dirname, "../../packages/ui/src"),
    },
  },
});
