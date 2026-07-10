import { test, expect } from '@playwright/test';

// Runs under the agent-chromium project (storageState: e2e/.auth/agent.json).
// Kept separate from monitor.spec.ts so the rest of the monitor suite (which assumes
// reviewer role) doesn't run twice under a different role.
const MONITOR_URL = () =>
  `/monitor?company=9001&location=222&date=20251224&monitoringID=${process.env.VITE_MONITORING_ID ?? ''}`;

test.beforeEach(async ({ page }) => {
  await page.goto(MONITOR_URL());
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });
});

test('Done button is disabled for agent role', async ({ page }) => {
  // MonitorHeader: disabled={isAgent || isDoneLoading} — only agents see it disabled by role.
  await expect(page.getByRole('button', { name: 'Done' })).toBeDisabled();
});
