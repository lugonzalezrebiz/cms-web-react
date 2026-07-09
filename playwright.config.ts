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
      },
      dependencies: ['setup'],
      testIgnore: ['**/admin-form.spec.ts', '**/monitor-agent.spec.ts'],
    },
    {
      name: 'admin-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup-admin'],
      testMatch: '**/admin-form.spec.ts',
    },
    {
      name: 'agent-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/agent.json',
      },
      dependencies: ['setup-agent'],
      testMatch: '**/monitor-agent.spec.ts',
    },
  ],
});
