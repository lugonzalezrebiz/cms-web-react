import { test as setup } from '@playwright/test';

const agentAuthFile = 'e2e/.auth/agent.json';

setup('authenticate agent user', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_AGENT_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_AGENT_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');
  await page.context().storageState({ path: agentAuthFile });
});
