// Playwright smoke suite — tests/e2e. See tests/README.md.
//
// Default: starts the mock Supabase + `next start` on the fixtures build
// (run `npm run build:fixtures` first). With BASE_URL set, runs against that
// deployment instead (a Vercel preview, or production) and starts nothing.
import { defineConfig } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3100);
const external = process.env.BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 3 : 4,
  reporter: process.env.CI ? [["list"], ["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: external || `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    { name: "mobile-390", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
    { name: "desktop-1440", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: external
    ? undefined
    : {
        command: `node tests/fixtures/with-mock.mjs npx next start -p ${PORT}`,
        url: `http://127.0.0.1:${PORT}/robots.txt`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        stdout: "ignore",
        stderr: "pipe",
      },
});
