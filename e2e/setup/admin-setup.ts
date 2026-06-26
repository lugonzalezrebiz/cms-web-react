import { test as setup } from '@playwright/test';

const adminAuthFile = 'e2e/.auth/admin.json';

setup('authenticate admin user', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_ADMIN_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_ADMIN_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');
  await page.context().storageState({ path: adminAuthFile });
});
