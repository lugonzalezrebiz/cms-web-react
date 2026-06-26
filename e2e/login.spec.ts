import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

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
