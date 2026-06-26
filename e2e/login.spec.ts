import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('login exitoso redirige al monitor', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await expect(page).toHaveURL(/\/assignments/);
});

test('credenciales incorrectas muestra error', async ({ page }) => {
  await page.goto('/');
  await page.locator('#username').fill('usuario_invalido');
  await page.locator('#password').fill('clave_invalida');
  await Promise.all([
    page.waitForResponse('**/auth/login'),
    page.getByRole('button', { name: 'Log In' }).click(),
  ]);
  await expect(page.getByText(/invalid username|connection error/i)).toBeVisible();
});
