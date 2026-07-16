import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

// STRICT_GEOLOCATION (.env) makes useLogin.ts block behind LocationGuard, without even
// calling auth/login, unless geolocation resolves — grant a fake position up front so
// these tests exercise the actual login request instead.
test.beforeEach(async ({ context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });
});

test('successful login redirects to assignments', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/assignments/);
});

test('invalid credentials show error message', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill('invalid_user');
  await page.locator('#password').fill('invalid_pass');
  await Promise.all([
    page.waitForResponse('**/auth/login'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ]);
  await expect(page.getByText(/invalid username|connection error/i)).toBeVisible();
});
