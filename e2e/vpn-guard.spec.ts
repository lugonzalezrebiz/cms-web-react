import { test, expect, type Page } from '@playwright/test';

// Covers the two full-screen "Guard" overlays that gate access based on a security signal:
// VpnGuard (src/components/VpnGuard.tsx) and LocationGuard (src/components/LocationGuard.tsx).
// Both only talk to window.api, which the real Electron preload script exposes exclusively
// inside the desktop app — it never exists in this Playwright suite's browser build. These
// tests fake that bridge via addInitScript so the guard logic can still be exercised
// end-to-end against the web build, driven by the same reviewer session used by the rest of
// the suite.
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
  // STRICT_GEOLOCATION would otherwise block this re-login behind LocationGuard instead.
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');

  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });
  await expect(vpnCard(page).getByText(/^\d{1,2}$/)).toHaveText('10');
});

// ─── LocationGuard (src/components/LocationGuard.tsx) ──────────────────────────
//
// useLogin.ts only sets locationBlocked when geolocation resolves to null AND
// STRICT_GEOLOCATION is on (.env has VITE_STRICT_GEOLOCATION=true, so the dev
// server this suite runs against has it enabled). Playwright's browser context
// grants no permissions by default, so navigator.geolocation.getCurrentPosition
// denies immediately — the same PERMISSION_DENIED path a user hits by blocking
// the location prompt. window.api.openLocationSettings is mocked the same way
// mockVpnApi mocks checkVpn, since it's also Electron-preload-only.

async function attemptLogin(page: Page, username = 'anyuser', password = 'anypass') {
  await page.goto('/login');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
}

async function mockLocationSettingsApi(page: Page) {
  await page.addInitScript(() => {
    const w = window as Window & {
      __openLocationSettingsCalls?: number;
      api?: { openLocationSettings: () => Promise<boolean> };
    };
    w.__openLocationSettingsCalls = 0;
    w.api = {
      ...w.api,
      openLocationSettings: () => {
        w.__openLocationSettingsCalls = (w.__openLocationSettingsCalls ?? 0) + 1;
        return Promise.resolve(true);
      },
    };
  });
}

test('shows the location guard when geolocation permission is denied', async ({ page }) => {
  await attemptLogin(page);
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });
});

test('does not show an "Open Location Settings" button in the browser build', async ({ page }) => {
  // window.api only exists behind the Electron preload — the web build has no OS
  // settings deep link to offer, so it must fall back to plain instructions.
  await attemptLogin(page);
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Open Location Settings' })).not.toBeVisible();
  await expect(
    page.getByText('Enable location permissions for this site in your browser to log in.'),
  ).toBeVisible();
});

test('shows an "Open Location Settings" button that calls window.api when available (desktop)', async ({ page }) => {
  await mockLocationSettingsApi(page);
  await attemptLogin(page);
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });

  const settingsButton = page.getByRole('button', { name: 'Open Location Settings' });
  await expect(settingsButton).toBeVisible();
  await settingsButton.click();

  await expect
    .poll(() => page.evaluate(() => (window as { __openLocationSettingsCalls?: number }).__openLocationSettingsCalls ?? 0))
    .toBe(1);
});

test('Cancel dismisses the location guard and returns to the login form', async ({ page }) => {
  await attemptLogin(page);
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByText('Location access required')).not.toBeVisible();
  await expect(page.locator('#username')).toBeVisible();
});

test('Try Again re-attempts geolocation and re-shows the guard while still denied', async ({ page }) => {
  await attemptLogin(page);
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Try Again' }).click();

  // Permission was never granted, so getCurrentPosition denies again instead of proceeding.
  await expect(page.getByText('Location access required')).toBeVisible({ timeout: 5_000 });
});

test('does not show the location guard and logs in normally when geolocation succeeds', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 40.7128, longitude: -74.006 });

  await attemptLogin(page, process.env.VITE_TEST_USER ?? '', process.env.VITE_TEST_PASS ?? '');
  await page.waitForURL('**/assignments**', { timeout: 10_000 });

  await expect(page.getByText('Location access required')).not.toBeVisible();
});
