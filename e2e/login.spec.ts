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

// useLogin.ts sends the resolved coordinates as x-latitude/x-longitude headers (getHeaders in
// usePost) instead of body fields, so the request body only ever carries credentials.
test('sends geolocation as x-latitude/x-longitude headers instead of in the request body', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');

  const [request] = await Promise.all([
    page.waitForRequest('**/auth/login'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ]);

  const headers = request.headers();
  expect(headers['x-latitude']).toBe('40.7128');
  expect(headers['x-longitude']).toBe('-74.006');

  const body = JSON.parse(request.postData() ?? '{}');
  expect(body).not.toHaveProperty('latitude');
  expect(body).not.toHaveProperty('longitude');
});
