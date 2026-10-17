import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000";
const vercelAuthToken = process.env.PLAYWRIGHT_VERCEL_AUTH_TOKEN ?? process.env.VERCEL_OIDC_TOKEN;
const protectionBypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  workers: 1,
  expect: { timeout: 30_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    browserName: "chromium",
    channel: "msedge",
    extraHTTPHeaders: protectionBypass ? { "x-vercel-protection-bypass": protectionBypass } : vercelAuthToken ? { "x-vercel-trusted-oidc-idp-token": vercelAuthToken } : undefined,
    trace: process.env.PLAYWRIGHT_BASE_URL ? "off" : "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "acceptance", use: { viewport: { width: 1440, height: 900 } } },
  ],  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
