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
  // The VPN is still active (the mock never turned off), so the pre-login VpnDialog
  // re-blocks the login page too — just without a countdown/grace period this time.
  await expect(page.getByText('VPN detected')).toBeVisible();
  await expect(vpnCard(page).getByText(/^\d{1,2}$/)).not.toBeVisible();
});

test('re-detecting a VPN after logout shows the overlay again on next login', async ({ page }) => {
  await mockVpnApi(page, true);
  await page.goto('/assignments');
  await expect(page).toHaveURL(/\/login/, { timeout: 12_000 });

  // The pre-login overlay blocks the login form while the VPN reads active, so disable
  // it first to actually reach the form, then log in and re-activate it afterward: a
  // freshly mounted VpnCountdownOverlay should restart the countdown back at 10s.
  await setVpnActive(page, false);
  await expect(page.getByText('VPN detected')).not.toBeVisible({ timeout: 5_000 });

  // STRICT_GEOLOCATION would otherwise block this re-login behind LocationGuard instead.
  await page.context().grantPermissions(['geolocation']);
  await page.context().setGeolocation({ latitude: 40.7128, longitude: -74.006 });
  await page.locator('#username').fill(process.env.VITE_TEST_USER ?? '');
  await page.locator('#password').fill(process.env.VITE_TEST_PASS ?? '');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.waitForURL('**/assignments**');

  await setVpnActive(page, true);
  await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });
  await expect(vpnCard(page).getByText(/^\d{1,2}$/)).toHaveText('10');
});

// Pre-login: VpnGuard now polls regardless of auth state, but there's no session to
// expire yet, so it just blocks access with no countdown/grace period.
test.describe('pre-login', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('shows the VPN overlay without a countdown before logging in', async ({ page }) => {
    await mockVpnApi(page, true);
    await page.goto('/login');

    await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('VPN connections are not allowed. Please disable your VPN to log in.')).toBeVisible();
    await expect(vpnCard(page).getByText(/^\d{1,2}$/)).not.toBeVisible();
  });

  test('hides the VPN overlay once the VPN is disabled before logging in', async ({ page }) => {
    await mockVpnApi(page, true);
    await page.goto('/login');
    await expect(page.getByText('VPN detected')).toBeVisible({ timeout: 5_000 });

    await setVpnActive(page, false);

    // Next poll cycle (every 3s) picks up the change and unmounts the overlay.
    await expect(page.getByText('VPN detected')).not.toBeVisible({ timeout: 5_000 });
  });
});

// ─── LocationGuard (src/components/LocationGuard.tsx + src/contexts/LocationGuardProvider.tsx) ──
//
// LocationGuardProvider wraps the whole app and polls geolocation on an interval
// (like VpnGuard's polling, also unconditional on `authenticated`), only ever
// blocking when STRICT_GEOLOCATION is on (.env has VITE_STRICT_GEOLOCATION=true, so
// the dev server this suite runs against has it enabled). The dialog shows a live
// "Rechecking in Ns" countdown to the next background check instead of a manual retry
// button, and there's no dismiss option pre-login — only once authenticated does a
// "Log Out" link appear, since there's no safe way to "dismiss" a missing permission
// while already signed in. Whether an unset browser-context permission makes
// navigator.geolocation.getCurrentPosition deny immediately or just hang varies by
// platform/Chromium build, so navigator.geolocation itself is stubbed directly here for
// a deterministic result — the same approach mockVpnApi uses for window.api, since
// window.api.openLocationSettings is also Electron-preload-only and mocked the same way.

async function mockGeolocation(page: Page, result: 'granted' | 'denied') {
  await page.addInitScript((mode) => {
    const geolocation: Partial<Geolocation> = {
      getCurrentPosition: (success, error) => {
        if (mode === 'granted') {
          success({
            coords: {
              latitude: 40.7128,
              longitude: -74.006,
              accuracy: 1,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
            },
            timestamp: Date.now(),
          } as GeolocationPosition);
        } else {
          error?.({
            code: 1,
            message: 'User denied Geolocation',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError);
        }
      },
      watchPosition: () => 0,
      clearWatch: () => {},
    };
    Object.defineProperty(window.navigator, 'geolocation', {
      value: geolocation,
      configurable: true,
    });
  }, result);
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

// Authenticated case: runs under the project's default (already signed-in) storageState,
// same as the VPN tests above, since LocationGuardProvider polls regardless of route.
test('shows the location guard when an authenticated session loses geolocation, and Log Out signs out', async ({ page }) => {
  await mockGeolocation(page, 'denied');
  await page.goto('/assignments');

  await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 5_000 });
  // No "Cancel" escape hatch once authenticated — dismissing is only safe by logging out.
  await expect(page.getByRole('button', { name: 'Cancel' })).not.toBeVisible();

  await page.getByRole('button', { name: 'Log Out' }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
});

// Pre-login case: forces an unauthenticated storageState so `authenticated` is false.
// Unlike the authenticated variant, there's no dismiss/escape hatch at all pre-login —
// the dialog only clears once the background recheck (see below) finds a location.
test.describe('unauthenticated', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  async function attemptLogin(page: Page, username = 'anyuser', password = 'anypass') {
    await page.goto('/login');
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
  }

  // LocationGuardProvider's background poll fires on mount regardless of route or
  // auth state, so a denied permission pops the guard as soon as /login loads —
  // no login attempt required. Its backdrop then blocks the Login button underneath,
  // so these cases navigate directly instead of going through attemptLogin().
  test('shows the location guard when geolocation permission is denied', async ({ page }) => {
    await mockGeolocation(page, 'denied');
    await page.goto('/login');
    await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 5_000 });
  });

  test('does not show an "Open Location Settings" button in the browser build', async ({ page }) => {
    // window.api only exists behind the Electron preload — the web build has no OS
    // settings deep link to offer, so it must fall back to plain instructions.
    await mockGeolocation(page, 'denied');
    await page.goto('/login');
    await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole('button', { name: 'Open Location Settings' })).not.toBeVisible();
    await expect(
      page.getByText('Location access is required to use this app.'),
    ).toBeVisible();
  });

  test('shows an "Open Location Settings" button that calls window.api when available (desktop)', async ({ page }) => {
    await mockGeolocation(page, 'denied');
    await mockLocationSettingsApi(page);
    await page.goto('/login');
    await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 5_000 });

    const settingsButton = page.getByRole('button', { name: 'Open Location Settings' });
    await expect(settingsButton).toBeVisible();
    await settingsButton.click();

    await expect
      .poll(() => page.evaluate(() => (window as { __openLocationSettingsCalls?: number }).__openLocationSettingsCalls ?? 0))
      .toBe(1);
  });

  test('automatically re-attempts geolocation on the countdown and re-shows the guard while still denied', async ({ page }) => {
    await mockGeolocation(page, 'denied');
    await page.goto('/login');
    await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 5_000 });

    // CHECK_INTERVAL_MS is 5s in LocationGuardProvider.tsx; the mocked
    // navigator.geolocation still denies, so the guard re-shows instead of proceeding.
    await expect(page.getByText('Enable Location Access')).toBeVisible({ timeout: 8_000 });
  });

  test('does not show the location guard and logs in normally when geolocation succeeds', async ({ page }) => {
    await mockGeolocation(page, 'granted');

    await attemptLogin(page, process.env.VITE_TEST_USER ?? '', process.env.VITE_TEST_PASS ?? '');
    await page.waitForURL('**/assignments**', { timeout: 10_000 });

    await expect(page.getByText('Enable Location Access')).not.toBeVisible();
  });
});
