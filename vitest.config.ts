import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],

    // ✅ critical: avoid test files running in parallel against the same SQLite DB
    fileParallelism: false,
    pool: "forks",
    maxThreads: 1,
    minThreads: 1,
  },
});
