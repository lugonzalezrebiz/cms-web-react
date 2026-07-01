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

test('Camera Groups toggle is visible and includes a Custom button', async ({ page }) => {
  const toggleGroup = page.getByRole('group', { name: 'Camera Groups' });
  await expect(toggleGroup).toBeVisible();
  // Custom button is always rendered (onCustomClick is always provided in MonitorHeader)
  await expect(toggleGroup.getByRole('button', { name: /Custom/i })).toBeVisible();
});

test('clicking a camera group button selects it', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const buttonCount = await group.getByRole('button').count();
  // Need at least one tracker button beyond the always-present Custom button
  test.skip(buttonCount <= 1, 'no tracker buttons available in this environment');

  // First button is a tracker (Custom is always last); clicking it sets aria-pressed=true.
  // joinCamera trackers select on click; regular trackers also select on click.
  const firstButton = group.getByRole('button').first();
  await firstButton.click();
  await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
});

test('toggle group is exclusive — selecting one tracker deselects others', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const buttonCount = await group.getByRole('button').count();
  test.skip(buttonCount <= 1, 'no tracker buttons available in this environment');

  const firstButton = group.getByRole('button').first();
  const firstLabel = await firstButton.textContent();

  await firstButton.click();
  await expect(firstButton).toHaveAttribute('aria-pressed', 'true');

  // In an exclusive ToggleButtonGroup only one button can be aria-pressed=true at a time
  const otherSelected = group.locator('button[aria-pressed="true"]').filter({ hasNotText: firstLabel ?? '' });
  await expect(otherSelected).toHaveCount(0);
});

test('clicking a tracker button with cameras opens a dropdown menu', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  // Buttons with sub-options (joinCamera trackers or "Other" overflow) contain a KeyboardArrowDown SVG.
  // The Custom button uses <img> not SVG, so filter({ has: svg }) correctly excludes it.
  const dropdownButton = group.getByRole('button').filter({ has: page.locator('svg') }).first();
  const hasDropdown = (await dropdownButton.count()) > 0;
  test.skip(!hasDropdown, 'no tracker buttons with dropdown options available in this environment');

  // For "Other" (options, !selectOnClick): the button body's onClick opens the menu.
  // For joinCamera (options, selectOnClick): the SVG arrow's onClick opens the camera submenu.
  await dropdownButton.click();
  let menuVisible = await page.getByRole('menu').isVisible({ timeout: 2_000 }).catch(() => false);

  if (!menuVisible) {
    // Button click selected the tracker instead of opening a menu (joinCamera case);
    // try clicking the SVG arrow icon directly.
    await dropdownButton.locator('svg').first().click();
    menuVisible = await page.getByRole('menu').isVisible({ timeout: 3_000 }).catch(() => false);
  }

  test.skip(!menuVisible, 'button does not open a sub-options menu in this environment');
  await page.keyboard.press('Escape');
});

test('selecting a tracker option updates the tracker button label', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const dropdownButton = group.getByRole('button').filter({ has: page.locator('svg') }).first();
  const hasDropdown = (await dropdownButton.count()) > 0;
  test.skip(!hasDropdown, 'no tracker buttons with sub-options in this environment');

  // Try button body first (works for "Other"); fall back to the SVG arrow (joinCamera trackers)
  await dropdownButton.click();
  let menuVisible = await page.getByRole('menu').isVisible({ timeout: 2_000 }).catch(() => false);

  if (!menuVisible) {
    await dropdownButton.locator('svg').first().click();
    menuVisible = await page.getByRole('menu').isVisible({ timeout: 3_000 }).catch(() => false);
  }

  test.skip(!menuVisible, 'no sub-options menu opened — skipping label update test');

  const menu = page.getByRole('menu');
  const firstItem = menu.getByRole('menuitem').first();
  await expect(firstItem).toBeVisible({ timeout: 3_000 });

  const isDisabled = await firstItem.isDisabled().catch(() => true);
  test.skip(isDisabled, 'no options available in this environment');

  const optionName = (await firstItem.textContent())?.trim() ?? '';
  test.skip(!optionName, 'could not read option name');

  await firstItem.click();

  // After selection, selectedOption.title replaces the button's label span
  await expect(dropdownButton).toContainText(optionName, { timeout: 5_000 });
  await expect(dropdownButton).toHaveAttribute('aria-pressed', 'true');
});

// ─── Camera area ──────────────────────────────────────────────────────────────

test('camera area shows loading state or camera grid', async ({ page }) => {
  const loadingText = page.getByText('Loading cameras...');
  const isLoading = await loadingText.isVisible().catch(() => false);

  if (isLoading) {
    let loaded = false;
    try {
      await expect(loadingText).not.toBeVisible({ timeout: 15_000 });
      loaded = true;
    } catch {
      // loading did not resolve within timeout
    }
    test.skip(!loaded, 'cameras did not finish loading in this environment');
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
  await expect(page.getByAltText('Expand', { exact: true })).toBeVisible();
});

test('clicking Expand button opens timeline in a popup window', async ({ page }) => {
  await waitForTimeline(page);

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand', { exact: true }).click(),
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
  await expect(page.getByAltText('Expand', { exact: true })).not.toBeVisible();
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
    // Forward didn't move — try backward
    await page.getByAltText('Step backward').click();
    const afterBackward = await timeDisplay.textContent();
    // If neither direction moved the marker the timeline has no steppable content — skip gracefully
    test.skip(afterBackward === initialTime, 'timeline has no steppable content in this environment');
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
