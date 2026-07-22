import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

config({ path: '.env' });

export default defineConfig({
  testDir: './e2e',
  timeout: process.env.CI ? 60_000 : 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/global-setup.ts',
    },
    {
      name: 'setup-admin',
      testMatch: '**/setup/admin-setup.ts',
    },
    {
      name: 'setup-agent',
      testMatch: '**/setup/agent-setup.ts',
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/user.json',
        // LocationGuardProvider polls geolocation on every authenticated page (not just
        // Login), and storageState only carries cookies/localStorage — not the permission
        // grant setup/*.ts made when creating that storageState — so it must be re-granted
        // here or every authenticated-flow test would trip the guard.
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7128, longitude: -74.006 },
      },
      dependencies: ['setup'],
      testIgnore: ['**/admin-form.spec.ts', '**/monitor-agent.spec.ts'],
    },
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7128, longitude: -74.006 },
      },
      dependencies: ['setup-admin'],
      testMatch: '**/admin-form.spec.ts',
    },
    {
      name: 'agent-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/agent.json',
        permissions: ['geolocation'],
        geolocation: { latitude: 40.7128, longitude: -74.006 },
      },
      dependencies: ['setup-agent'],
      testMatch: '**/monitor-agent.spec.ts',
    },
  ],
});
