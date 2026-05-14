import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  timeout:  30_000,
  retries:  1,
  use: {
    baseURL:    "http://localhost:5173",
    headless:   true,
    screenshot: "only-on-failure",
    locale:     "pt-BR",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
