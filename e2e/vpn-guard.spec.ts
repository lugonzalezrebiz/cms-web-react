import { test, expect, type Page } from '@playwright/test';

// VpnGuard (src/components/VpnGuard.tsx) only polls window.api.checkVpn, which the real
// Electron preload script exposes exclusively inside the desktop app — it never exists in
// this Playwright suite's browser build. These tests fake that bridge via addInitScript so
// the polling/countdown/cancel/logout logic can still be exercised end-to-end against the
// web build, driven by the same reviewer session used by the rest of the suite.
type VpnWindow = Window & {
  __vpnActive?: boolean;
  api?: { checkVpn: () => Promise<boolean> };
};

async function mockVpnApi(page: Page, initialActive: boolean) {
  await page.addInitScript((active) => {
    const w = window as VpnWindow;
    w.__vpnActive = active;
    w.api = { ...w.api, checkVpn: () => Promise.resolve(w.__vpnActive ?? false) };
  }, initialActive);
}

async function setVpnActive(page: Page, active: boolean) {
  await page.evaluate((v) => {
    (window as VpnWindow).__vpnActive = v;
  }, active);
}

// Scopes to the overlay card so the countdown number isn't confused with unrelated
// numeric text elsewhere on the page.
function vpnCard(page: Page) {
  return page.getByText('VPN detected').locator('xpath=..');
}

test('does not show the VPN overlay when no VPN is detected', async ({ page }) => {
  await mockVpnApi(page, false);
  await page.goto('/assignments');

  // Give at least one polling cycle (every 3s) a chance to run before asserting absence.
  await page.waitForTimeout(3_500);
  await expect(page.getByText('VPN detected')).not.toBeVisible();
});

test('shows the VPN overlay with a 10s countdown once a VPN is detected', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');

  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });
  await expect(vpnCard(page).getByText(/^\d{1,2}$/)).toHaveText('10');
});

test('the countdown ticks down while the VPN stays active', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');
  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });

  const countdown = vpnCard(page).getByText(/^\d{1,2}$/);
  const first = Number(await countdown.textContent());

  await expect(async () => {
    const current = Number(await countdown.textContent());
    expect(current).toBeLessThan(first);
  }).toPass({ timeout: 5_000 });
});

test('turning the VPN off before the grace period cancels the overlay without logging out', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');
  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });

  await setVpnActive(page, false);

  // Next poll cycle (every 3s) picks up the change and unmounts the overlay.
  await expect(page.getByText('VPN detected')).not.toBeVisible({ timeout: 5_000 });
  // Session must still be authenticated — cancelling before expiry must not log the user out.
  await expect(page).toHaveURL(/\/assignments/);
});

test('leaving the VPN active for the full grace period logs the user out', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');
  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });

  // GRACE_PERIOD_MS is 10s in VpnGuard.tsx; logout() clears the token, ProtectedRole
  // then redirects away from the authenticated route.
  await expect(page).toHaveURL(/\/login/, { timeout: 12_000 });
  await expect(page.getByText('VPN detected')).not.toBeVisible();
});

test('re-detecting a VPN after logout shows the overlay again on next login', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');
  await expect(page).toHaveURL(/\/login/, { timeout: 12_000 });

  // VpnGuard only polls while authenticated; logging back in should re-arm it independently
  // of the previous countdown (a fresh VpnCountdownOverlay mount starts back at 10s).
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');

  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });
  await expect(vpnCard(page).getByText(/^\d{1,2}$/)).toHaveText('10');
});
