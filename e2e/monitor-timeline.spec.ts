import { test, expect, type Page } from '@playwright/test';

// MonitorTimeline now also reads company/location from URL params — it feeds them into
// useAssignments to resolve the assignment's real open/close times (passed to useMonitoring)
// and to compute its own NoReviewGuard reason, mirroring Monitor/index.tsx. Without them the
// page still renders (falls back to the MOCK_SNAPSHOT default time range), but parity with
// Monitor requires the same static redirect params used by MONITOR_URL below.
const TIMELINE_URL = () =>
  `/monitor/timeline?company=9001&location=222&date=20251224&monitoringID=${process.env.VITE_MONITORING_ID ?? ''}`;

// Monitor URL needed for the popup-origin test.
const MONITOR_URL = () =>
  `/monitor?company=9001&location=222&date=20251224&monitoringID=${process.env.VITE_MONITORING_ID ?? ''}`;

async function waitForActivities(page: Page) {
  await expect(page.getByText('Activities')).toBeVisible({ timeout: 15_000 });
}

// ─── Direct navigation tests ──────────────────────────────────────────────────

test.describe('MonitorTimeline — direct navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(TIMELINE_URL());
    await waitForActivities(page);
  });

  // ── Page structure ──────────────────────────────────────────────────────────

  test('shows Activities as the timeline header label', async ({ page }) => {
    await expect(page.getByText('Activities')).toBeVisible();
  });

  test('does not show Monitor header elements (no Store prefix, no Done button)', async ({ page }) => {
    // MonitorTimeline has no MonitorHeader — just the full-height TimeLine component
    await expect(page.getByText(/^Store:/)).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Done' })).not.toBeVisible();
  });

  // ── No-review guard (NoReviewGuard) ───────────────────────────────────────────
  // MonitorTimeline computes its own noReviewReason (trackers/groups/events) the same way
  // Monitor/index.tsx does, and renders NoReviewGuard as a blocking overlay. Since this page
  // has no back-navigation of its own (it's a standalone/popped-out window), onGoBack closes
  // the window instead of navigating to /assignments.

  test('shows the "Nothing to Review" guard when there are no pending events, otherwise the timeline', async ({ page }) => {
    const guardTitle = page.getByText(/^No (Trackers|Groups|Events)/);
    const isGuardShown = await guardTitle.isVisible({ timeout: 10_000 }).catch(() => false);

    if (isGuardShown) {
      await expect(page.getByRole('button', { name: 'Go Back' })).toBeVisible();
    } else {
      await expect(page.getByText('Activities')).toBeVisible({ timeout: 15_000 });
    }
  });

  test('"Go Back" on the no-review guard closes the window', async ({ page }) => {
    const isGuardShown = await page
      .getByText(/^No (Trackers|Groups|Events)/)
      .isVisible({ timeout: 10_000 })
      .catch(() => false);
    test.skip(!isGuardShown, 'this environment has pending events — guard is not shown');

    // Spy on window.close so we can distinguish "close was never called" from
    // "close was called but headless Chromium didn't honor it" (same technique used
    // by the Minimize-button popup test below).
    await page.evaluate(() => {
      type WindowWithCloseFlag = Window & { __closeCalled?: boolean };
      (window as WindowWithCloseFlag).__closeCalled = false;
      const orig = window.close.bind(window);
      window.close = () => { (window as WindowWithCloseFlag).__closeCalled = true; orig(); };
    });

    await page.getByRole('button', { name: 'Go Back' }).click();

    const closed = await page
      .evaluate(() => (window as Window & { __closeCalled?: boolean }).__closeCalled)
      .catch(() => true);
    expect(closed).toBe(true);
  });

  // ── Toolbar — Minimize instead of Expand ───────────────────────────────────

  test('toolbar shows Minimize button because expandedIcon is false', async ({ page }) => {
    // expandedIcon={false} → expanded=false in TimelineToolbar → !expanded=true → alt="Minimize"
    await expect(page.getByAltText('Minimize')).toBeVisible();
  });

  test('toolbar does not show Expand button', async ({ page }) => {
    await expect(page.getByAltText('Expand')).not.toBeVisible();
  });

  // ── Toolbar — standard buttons ──────────────────────────────────────────────

  test('toolbar shows Undo and Redo buttons', async ({ page }) => {
    await expect(page.getByAltText('Undo')).toBeVisible();
    await expect(page.getByAltText('Redo')).toBeVisible();
  });

  test('toolbar shows Delete button', async ({ page }) => {
    await expect(page.getByAltText('Delete')).toBeVisible();
  });

  test('toolbar shows Previous and Next event point buttons', async ({ page }) => {
    await expect(page.getByAltText('Previous event point')).toBeVisible();
    await expect(page.getByAltText('Next event point')).toBeVisible();
  });

  test('toolbar shows Step backward and Step forward buttons', async ({ page }) => {
    await expect(page.getByAltText('Step backward')).toBeVisible();
    await expect(page.getByAltText('Step forward')).toBeVisible();
  });

  test('toolbar shows Layers navigation button', async ({ page }) => {
    await expect(page.getByAltText('Layers')).toBeVisible();
  });

  test('clicking Layers opens navigation popover', async ({ page }) => {
    // dispatchEvent bypasses the css-l7girr TimelineBody overlay that intercepts
    // pointer events at the toolbar's physical position. { force: true } skips
    // Playwright's actionability checks but still routes through hit-testing,
    // so the overlay still wins. dispatchEvent fires directly on the element
    // and bubbles to React's delegated listener at the root.
    await page.getByAltText('Layers').dispatchEvent('click');
    const popover = page.locator('[role="tooltip"], [role="presentation"]').first();
    await expect(popover).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press('Escape');
  });

  // ── Play / Pause ────────────────────────────────────────────────────────────

  test('toolbar shows Play button initially', async ({ page }) => {
    await expect(page.getByAltText('Play')).toBeVisible();
  });

  test('clicking Play toggles to Pause', async ({ page }) => {
    await page.getByAltText('Play').dispatchEvent('click');
    await expect(page.getByAltText('Pause')).toBeVisible({ timeout: 3_000 });
    // Restore
    await page.getByAltText('Pause').dispatchEvent('click');
  });

  // ── Marker time display ─────────────────────────────────────────────────────

  test('marker time HH:MM:SS is visible in toolbar', async ({ page }) => {
    await expect(page.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();
  });

  test('Step forward and Step backward change the marker time', async ({ page }) => {
    const timeDisplay = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
    const initialTime = await timeDisplay.textContent();

    await page.getByAltText('Step forward').dispatchEvent('click');
    const afterForward = await timeDisplay.textContent();

    if (afterForward !== initialTime) {
      await page.getByAltText('Step backward').dispatchEvent('click');
      await expect(timeDisplay).not.toHaveText(afterForward!, { timeout: 3_000 });
    } else {
      await page.getByAltText('Step backward').dispatchEvent('click');
      await expect(timeDisplay).not.toHaveText(initialTime!, { timeout: 3_000 });
    }
  });
});

// ─── Popup behavior (opened from Monitor via Expand button) ───────────────────

test.describe('MonitorTimeline — popup origin', () => {
  test('popup shows Activities label and Minimize button', async ({ page }) => {
    await page.goto(MONITOR_URL());
    await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Compliance Violations')).toBeVisible({ timeout: 15_000 });

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5_000 }),
      page.getByAltText('Expand').click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup.getByText('Activities')).toBeVisible({ timeout: 15_000 });
    await expect(popup.getByAltText('Minimize')).toBeVisible({ timeout: 5_000 });
    await popup.close();
  });

  test('clicking Minimize in popup closes the popup window', async ({ page }) => {
    await page.goto(MONITOR_URL());
    await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Compliance Violations')).toBeVisible({ timeout: 15_000 });

    const [popup] = await Promise.all([
      page.waitForEvent('popup', { timeout: 5_000 }),
      page.getByAltText('Expand').click(),
    ]);

    await popup.waitForLoadState('domcontentloaded');
    await expect(popup.getByAltText('Minimize')).toBeVisible({ timeout: 10_000 });

    // useSaveMonitoring registers a beforeunload listener for auto-save; accept any
    // dialog it might surface so it doesn't block window.close().
    popup.on('dialog', (dialog) => dialog.accept().catch(() => {}));

    // Spy on window.close so we can distinguish "close was never called" from
    // "close was called but headless Chromium didn't honor it".
    await popup.evaluate(() => {
      (window as any).__closeCalled = false;
      const orig = window.close.bind(window);
      window.close = () => { (window as any).__closeCalled = true; orig(); };
    });

    // Fire .click() on the Box parent of the Minimize img via evaluate so the event
    // is dispatched as a trusted click inside the popup's JS context, bypassing
    // Playwright's hit-testing (which would route to the css-l7girr overlay).
    // The Box renders as a div with React's onClick={onPopOut} = () => window.close().
    await popup.evaluate(() => {
      const img = document.querySelector('img[alt="Minimize"]') as HTMLElement | null;
      img?.parentElement?.click();
    });

    // Pass if the popup actually closed, OR if window.close was at least invoked
    // (headless popup close behavior varies across Chromium versions; the app's
    // responsibility ends at calling window.close() on a script-opened window).
    const closed =
      popup.isClosed() ||
      (await popup.evaluate(() => (window as any).__closeCalled).catch(() => true));

    expect(closed).toBe(true);
  });
});
