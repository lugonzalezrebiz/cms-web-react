import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('autenticar usuario', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');
  await page.context().storageState({ path: authFile });
});
