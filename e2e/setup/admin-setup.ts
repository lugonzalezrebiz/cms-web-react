import { test as setup } from '@playwright/test';

const adminAuthFile = 'e2e/.auth/admin.json';

setup('authenticate admin user', async ({ page }) => {
  // STRICT_GEOLOCATION blocks login behind LocationGuard without this — grant a fake
  // position up front so the setup flow reaches /assignments like a real user would.
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });

  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_ADMIN_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_ADMIN_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');
  await page.context().storageState({ path: adminAuthFile });
});
