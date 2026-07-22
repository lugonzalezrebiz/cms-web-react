import { test as setup } from '@playwright/test';

const authFile = 'e2e/.auth/user.json';

setup('authenticate user', async ({ page }) => {
  // STRICT_GEOLOCATION blocks login behind LocationGuard without this — grant a fake
  // position up front so the setup flow reaches /assignments like a real user would.
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });

  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');
  await page.context().storageState({ path: authFile });
});
