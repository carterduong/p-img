import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    fileParallelism: false,
    setupFiles: ["./tests/setup.ts"],
  },
});
