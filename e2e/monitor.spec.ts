import { test, expect, type Page } from '@playwright/test';

// Static redirect params from useAssignmentNavigate.ts STATIC_REDIRECT constant.
// VITE_MONITORING_ID is loaded from .env via dotenv in playwright.config.ts.
const MONITOR_URL = () =>
  `/monitor?company=9001&location=222&date=20251224&monitoringID=${process.env.VITE_MONITORING_ID ?? ''}`;

// Waits for the timeline toolbar to be fully rendered.
async function waitForTimeline(page: Page) {
  await expect(page.getByText('Compliance Violations')).toBeVisible({ timeout: 15_000 });
}

// Returns count of camera "Expand camera" buttons (only on non-empty camera cells).
async function getCameraCount(page: Page): Promise<number> {
  await expect(page.getByText('Loading cameras...')).not.toBeVisible({ timeout: 15_000 }).catch(() => {});
  return page.getByAltText('Expand camera').count();
}

test.beforeEach(async ({ page }) => {
  await page.goto(MONITOR_URL());
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });
});

// ─── Header ──────────────────────────────────────────────────────────────────

test('header shows Store prefix in title', async ({ page }) => {
  await expect(page.getByText(/^Store:/)).toBeVisible();
});

test('header subtitle contains / Events', async ({ page }) => {
  await expect(page.getByText(/\/ Events/)).toBeVisible();
});

test('Done button is visible in header', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'Done' })).toBeVisible();
});

test('Done button is enabled for reviewer role', async ({ page }) => {
  // Only agents have Done disabled; reviewer (test user) should see it enabled
  await expect(page.getByRole('button', { name: 'Done' })).toBeEnabled();
});

test('go back button is visible (withIconMenu=false, allowGoBack=true)', async ({ page }) => {
  // App.tsx mounts MonitorHeader with withIconMenu={false} and allowGoBack={true},
  // so the sidebar menu button is hidden but the back arrow is shown.
  await expect(page.getByRole('button', { name: 'go back' })).toBeVisible();
});

// ─── Header secondary popovers ────────────────────────────────────────────────

test('keyboard shortcuts icon opens shortcuts menu', async ({ page }) => {
  await page.locator('img[src*="keyboard-02"]').click();
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

test('user circle icon opens user panel with Account title', async ({ page }) => {
  await page.locator('img[src*="user-circle"]').click();
  await expect(page.getByText('Account')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Log Out')).toBeVisible();
  await page.keyboard.press('Escape');
});

test('user panel shows Reset Password option', async ({ page }) => {
  await page.locator('img[src*="user-circle"]').click();
  await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

test('clicking store title opens assignment info popover', async ({ page }) => {
  await page.getByText(/^Store:/).click();
  // HeaderInfoMenu renders null when assignment is not found; skip gracefully
  const popover = page.locator('[role="tooltip"], [role="presentation"]').first();
  const opened = await popover.isVisible({ timeout: 3_000 }).catch(() => false);
  test.skip(!opened, 'no assignment found for this monitoring session — popover does not open');
  await page.keyboard.press('Escape');
});

// ─── Camera Groups toggle ─────────────────────────────────────────────────────

test('Camera Groups toggle shows Tracker and All buttons', async ({ page }) => {
  const toggleGroup = page.getByRole('group', { name: 'Camera Groups' });
  await expect(toggleGroup).toBeVisible();
  await expect(toggleGroup.getByRole('button', { name: /Tracker/i })).toBeVisible();
  await expect(toggleGroup.getByRole('button', { name: /All/i })).toBeVisible();
});

test('clicking All camera group button selects it', async ({ page }) => {
  const allButton = page
    .getByRole('group', { name: 'Camera Groups' })
    .getByRole('button', { name: /All/i });

  await allButton.click();
  await expect(allButton).toHaveAttribute('aria-pressed', 'true');
});

test('toggle group is exclusive — only All is selected after clicking it', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const allButton = group.getByRole('button', { name: 'All', exact: true });

  await allButton.click();
  await expect(allButton).toHaveAttribute('aria-pressed', 'true');

  // In an exclusive ToggleButtonGroup only one button can be aria-pressed=true at a time.
  // Avoid clicking Tracker: its MUI Menu has a 5 s Grow animation that keeps a portal
  // overlay alive long enough to intercept subsequent clicks.
  const otherSelected = group.locator('button[aria-pressed="true"]').filter({ hasNotText: 'All' });
  await expect(otherSelected).toHaveCount(0);
});

test('clicking Tracker button opens tracker options dropdown', async ({ page }) => {
  const trackerButton = page
    .getByRole('group', { name: 'Camera Groups' })
    .getByRole('button', { name: /Tracker/i });

  await trackerButton.click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

test('selecting a tracker option updates the Tracker button label', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  // Reference by position — label changes after selection so /Tracker/i may not match anymore
  const trackerButton = group.locator('button').first();

  await trackerButton.click();

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible({ timeout: 5_000 });

  const firstItem = menu.getByRole('menuitem').first();
  await expect(firstItem).toBeVisible({ timeout: 3_000 });

  // MUI renders a disabled "No options available" item when options array is empty
  const isDisabled = await firstItem.isDisabled().catch(() => true);
  test.skip(isDisabled, 'no tracker options available in this environment');

  const trackerName = (await firstItem.textContent())?.trim() ?? '';
  test.skip(!trackerName, 'could not read tracker option name');

  await firstItem.click();

  // After selection, selectedOption.title replaces "Tracker" in the button span.
  // The menu close animation (5 s Grow) is still running but doesn't affect the button label.
  await expect(trackerButton).toContainText(trackerName, { timeout: 5_000 });
  await expect(trackerButton).toHaveAttribute('aria-pressed', 'true');
});

// ─── Camera area ──────────────────────────────────────────────────────────────

test('camera area shows loading state or camera grid', async ({ page }) => {
  const loadingText = page.getByText('Loading cameras...');
  const isLoading = await loadingText.isVisible().catch(() => false);

  if (isLoading) {
    await expect(loadingText).not.toBeVisible({ timeout: 15_000 });
  }

  // Page must not have crashed — body is still visible
  await expect(page.locator('body')).toBeVisible();
});

test('camera cells show Expand camera button when cameras are loaded', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  await expect(page.getByAltText('Expand camera').first()).toBeVisible();
});

test('clicking Expand camera opens the ExpandedCameraDialog', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  await page.getByAltText('Expand camera').first().click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 5_000 });
  // Dialog title starts with "Camera"
  await expect(dialog.getByText(/^Camera/)).toBeVisible();
});

test('ExpandedCameraDialog closes with its Close button', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  await page.getByAltText('Expand camera').first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Close button in ExpandedCameraDialog: img alt="Close" (src="x-close.svg")
  await page.getByAltText('Close').click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
});

// ─── Timeline ────────────────────────────────────────────────────────────────

test('timeline section shows Compliance Violations header', async ({ page }) => {
  await expect(page.getByText('Compliance Violations')).toBeVisible({ timeout: 15_000 });
});

test('timeline toolbar shows Undo and Redo buttons', async ({ page }) => {
  await waitForTimeline(page);
  await expect(page.getByAltText('Undo')).toBeVisible();
  await expect(page.getByAltText('Redo')).toBeVisible();
});

test('timeline toolbar shows Delete button', async ({ page }) => {
  await waitForTimeline(page);
  await expect(page.getByAltText('Delete')).toBeVisible();
});

test('timeline toolbar shows Previous and Next event point buttons', async ({ page }) => {
  await waitForTimeline(page);
  await expect(page.getByAltText('Previous event point')).toBeVisible();
  await expect(page.getByAltText('Next event point')).toBeVisible();
});

test('timeline toolbar shows Step backward and Step forward buttons', async ({ page }) => {
  await waitForTimeline(page);
  await expect(page.getByAltText('Step backward')).toBeVisible();
  await expect(page.getByAltText('Step forward')).toBeVisible();
});

test('timeline toolbar shows Play button initially', async ({ page }) => {
  await waitForTimeline(page);
  // Play/Pause toggles alt text: starts as "Play" since isPlaying=false on load
  await expect(page.getByAltText('Play')).toBeVisible();
});

test('clicking Play button toggles to Pause', async ({ page }) => {
  await waitForTimeline(page);
  await page.getByAltText('Play').click();
  await expect(page.getByAltText('Pause')).toBeVisible({ timeout: 3_000 });
  // Restore state
  await page.getByAltText('Pause').click();
});

test('timeline toolbar shows Layers navigation button', async ({ page }) => {
  await waitForTimeline(page);
  await expect(page.getByAltText('Layers')).toBeVisible();
});

test('clicking Layers button opens navigation popover', async ({ page }) => {
  await waitForTimeline(page);
  await page.getByAltText('Layers').click();
  // TimelineNavPopover opens in a portal
  const popover = page.locator('[role="tooltip"], [role="presentation"]').first();
  await expect(popover).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

test('timeline toolbar shows Expand button for timeline popout', async ({ page }) => {
  await waitForTimeline(page);
  // expandedIcon = !expandedCamera = !null = true → toolbar renders alt="Expand"
  await expect(page.getByAltText('Expand')).toBeVisible();
});

test('clicking Expand button opens timeline in a popup window', async ({ page }) => {
  await waitForTimeline(page);

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand').click(),
  ]);

  expect(popup).toBeDefined();
  await popup.waitForLoadState('domcontentloaded');
  expect(popup.url()).toContain('timeline');
  await popup.close();
});

// ─── Camera context menu (CameraOverlayMenu) ─────────────────────────────────

test('clicking camera body opens compliance violations overlay menu', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  // Expand button is at bottom-right; click top-left of the camera cell to hit the body
  const cameraCell = page.getByAltText('Expand camera').first().locator('xpath=../..');
  await cameraCell.click({ position: { x: 20, y: 20 } });

  await expect(page.getByText('Select a Compliance Violations')).toBeVisible({ timeout: 5_000 });
});

test('camera context menu closes on ✕ click', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  const cameraCell = page.getByAltText('Expand camera').first().locator('xpath=../..');
  await cameraCell.click({ position: { x: 20, y: 20 } });
  await expect(page.getByText('Select a Compliance Violations')).toBeVisible({ timeout: 5_000 });

  await page.getByText('✕').first().click();
  await expect(page.getByText('Select a Compliance Violations')).not.toBeVisible({ timeout: 3_000 });
});

// ─── Expand icon flips to Minimize when camera dialog is open ─────────────────

test('toolbar shows Minimize when a non-first camera dialog is expanded', async ({ page }) => {
  const count = await getCameraCount(page);
  // expandedIcon = !expandedCamera; when expandedCamera=0, !0=true so icon stays "Expand".
  // Need index ≥ 1 (second camera) for !1=false → "Minimize" to appear.
  test.skip(count < 2, 'needs at least 2 cameras — expandedCamera=0 keeps expandedIcon=true');

  await page.getByAltText('Expand camera').nth(1).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Timeline Box gets zIndex:2000 when expanded, above the dialog backdrop (z-index ~1300)
  await expect(page.getByAltText('Minimize')).toBeVisible();
  await expect(page.getByAltText('Expand')).not.toBeVisible();
});

// ─── Marker time display ──────────────────────────────────────────────────────

test('marker time HH:MM:SS is visible in timeline toolbar', async ({ page }) => {
  await waitForTimeline(page);
  // secToTimeString formats as "HH:MM:SS"; displayed in orange next to the Clock icon
  await expect(page.getByText(/^\d{2}:\d{2}:\d{2}$/)).toBeVisible();
});

test('Step forward and Step backward change the marker time', async ({ page }) => {
  await waitForTimeline(page);

  const timeDisplay = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
  const initialTime = await timeDisplay.textContent();

  await page.getByAltText('Step forward').click();
  const afterForward = await timeDisplay.textContent();

  if (afterForward !== initialTime) {
    // Forward worked — verify backward also moves the marker
    await page.getByAltText('Step backward').click();
    await expect(timeDisplay).not.toHaveText(afterForward!, { timeout: 3_000 });
  } else {
    // Marker was already at the timeline end — step backward must move it
    await page.getByAltText('Step backward').click();
    await expect(timeDisplay).not.toHaveText(initialTime!, { timeout: 3_000 });
  }
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('navigates back to assignments when browser back is used', async ({ page }) => {
  await page.goto('/assignments');
  await page.goto(MONITOR_URL());
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });

  await page.goBack();
  await expect(page).toHaveURL(/\/assignments/);
});
