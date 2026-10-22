/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Served from https://ota-eita.github.io/slo-dashboard/ on GitHub Pages.
export default defineConfig({
  base: "/slo-dashboard/",
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    coverage: {
      include: ["src/**"],
      exclude: ["src/main.tsx", "src/test-setup.ts", "src/vite-env.d.ts"],
      thresholds: { lines: 90, functions: 90, branches: 85, statements: 90 },
    },
  },
});
