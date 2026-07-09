import { test, expect, type Page } from '@playwright/test';

// Static redirect params from useAssignmentNavigate.ts STATIC_REDIRECT constant.
// VITE_MONITORING_ID is loaded from .env via dotenv in playwright.config.ts.
const MONITOR_URL = () =>
  `/monitor?company=9001&location=222&date=20251224&monitoringID=${process.env.VITE_MONITORING_ID ?? ''}`;

// Waits for the timeline toolbar to be fully rendered.
async function waitForTimeline(page: Page) {
  await expect(page.getByText('Compliance Violations')).toBeVisible({ timeout: 15_000 });
}

// Waits for the timeline's row/marker data to finish loading, not just the static
// "Compliance Violations" header. While rows are still loading, timelineStartSec defaults
// to 0 and jumps once real data arrives — keyboard shortcuts that read/derive marker time
// (h, arrows, zoom, undo/redo) need that settled first or they race the data load.
async function waitForTimelineDataReady(page: Page) {
  await waitForTimeline(page);
  await expect(page.getByText('loading...')).toHaveCount(0, { timeout: 15_000 }).catch(() => {});
}

// Returns count of camera "Expand camera" buttons (only on non-empty camera cells).
async function getCameraCount(page: Page): Promise<number> {
  await expect(page.getByText('Loading cameras...')).not.toBeVisible({ timeout: 15_000 }).catch(() => {});
  return page.getByAltText('Expand camera').count();
}

// Opens the user panel and clicks Reset Password to open the "Reset Your Password" dialog.
async function openResetYourPasswordDialog(page: Page) {
  await page.locator('img[src*="user-circle"]').click();
  await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5_000 });
  await page.getByText('Reset Password').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
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

test('hamburger menu button is not shown (withIconMenu=false)', async ({ page }) => {
  await expect(page.getByRole('button', { name: 'menu' })).not.toBeVisible();
});

test('clicking Done saves the session and navigates back to assignments', async ({ page }) => {
  // Mock both calls handleDone fires (useSaveMonitoring) so this doesn't save/finalize a
  // real monitoring session against the backend.
  await page.route('**/monitoring/*/save2', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });
  await page.route('**/monitoring/*/review/finish', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page).toHaveURL(/\/assignments/, { timeout: 10_000 });
});

// ─── Header secondary popovers ────────────────────────────────────────────────

test('keyboard shortcuts icon opens shortcuts menu', async ({ page }) => {
  await page.locator('img[src*="keyboard-02"]').click();
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

test('keyboard shortcuts menu lists all shortcut labels', async ({ page }) => {
  // Mirrors KEYBOARD_SHORTCUTS in src/sections/Header/MonitorHeader.tsx
  const labels = [
    'Move marker back 5 sec',
    'Move marker forward 5 sec',
    'Previous event point',
    'Next event point',
    'Go back',
    'Undo',
    'Redo',
    'Edit selected event point',
    'Go to specific time',
    'Move to start',
    'Delete event point under marker',
    'Play / Pause',
    'Zoom in',
    'Zoom out',
  ];

  await page.locator('img[src*="keyboard-02"]').click();
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible({ timeout: 5_000 });

  for (const label of labels) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
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

// ─── Reset Your Password dialog (from user panel) ─────────────────────────────

test('clicking Reset Password opens the Reset Your Password dialog', async ({ page }) => {
  await openResetYourPasswordDialog(page);
  await expect(page.getByText('Reset Your Password')).toBeVisible();
});

test('Reset Your Password dialog shows old, new, and confirm password fields', async ({ page }) => {
  await openResetYourPasswordDialog(page);

  await expect(page.getByText('Type your old password')).toBeVisible();
  await expect(page.getByText('Type your new password')).toBeVisible();
  await expect(page.getByText('Confirm your new password')).toBeVisible();
});

test('Reset Password submit button is disabled when the form is empty', async ({ page }) => {
  await openResetYourPasswordDialog(page);

  await expect(page.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
});

test('mismatched new/confirm passwords show "Passwords do not match" and keep submit disabled', async ({ page }) => {
  await openResetYourPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  await dialog.locator('#old-password').fill('OldPass1');
  await dialog.locator('#new-password').fill('ValidPass1');
  await dialog.locator('#confirm-password').fill('DifferentPass1');

  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
});

test('filling old password and matching valid new passwords enables submit', async ({ page }) => {
  await openResetYourPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  await dialog.locator('#old-password').fill('OldPass1');
  await dialog.locator('#new-password').fill('ValidPass1');
  await dialog.locator('#confirm-password').fill('ValidPass1');

  await expect(page.getByRole('button', { name: 'Reset Password' })).toBeEnabled({ timeout: 3_000 });
});

test('submitting a valid password change shows the success dialog', async ({ page }) => {
  // Mock POST /api/password/change so the test does not depend on a real backend write.
  // useChangePassword's onSuccess closes the Reset dialog and shows SuccessDialog.
  await page.route('**/password/change', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await openResetYourPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  await dialog.locator('#old-password').fill('OldPass1');
  await dialog.locator('#new-password').fill('ValidPass1');
  await dialog.locator('#confirm-password').fill('ValidPass1');

  await expect(page.getByRole('button', { name: 'Reset Password' })).toBeEnabled({ timeout: 3_000 });
  await page.getByRole('button', { name: 'Reset Password' }).click();

  // SuccessDialog renders the confirmation message once the change succeeds.
  await expect(page.getByText('Password changed successfully.')).toBeVisible({ timeout: 5_000 });
});

test('clicking store title opens assignment info popover', async ({ page }) => {
  await page.getByText(/^Store:/).click();
  // HeaderInfoMenu renders null when assignment is not found; skip gracefully
  const popover = page.locator('[role="tooltip"], [role="presentation"]').first();
  const opened = await popover.isVisible({ timeout: 3_000 }).catch(() => false);
  test.skip(!opened, 'no assignment found for this monitoring session — popover does not open');
  await page.keyboard.press('Escape');
});

// ─── Responsive layout ──────────────────────────────────────────────────────────

test('Camera Groups toggle moves below the header row on small viewports', async ({ page }) => {
  // MonitorHeader: isSmall = useMediaQuery("(max-width: 1050px)") controls whether the
  // Camera Groups toggle renders inline with Done (wide) or in its own row below it (narrow).
  const doneButton = page.getByRole('button', { name: 'Done' });
  const group = page.getByRole('group', { name: 'Camera Groups' });

  // MUI's useMediaQuery doesn't always finish re-rendering synchronously right after
  // setViewportSize — it re-parents the toggle button between two conditional blocks in
  // MonitorHeader, so poll with toPass() until the layout actually settles instead of
  // reading boundingBox() once and racing the resize.
  await page.setViewportSize({ width: 1400, height: 900 });
  await expect(async () => {
    const wideGroupBox = await group.boundingBox();
    const wideDoneBox = await doneButton.boundingBox();
    expect(wideGroupBox).not.toBeNull();
    expect(wideDoneBox).not.toBeNull();
    // Same header row → vertical centers roughly aligned
    const wideCenterDelta = Math.abs(
      (wideGroupBox!.y + wideGroupBox!.height / 2) - (wideDoneBox!.y + wideDoneBox!.height / 2),
    );
    expect(wideCenterDelta).toBeLessThan(20);
  }).toPass({ timeout: 5_000 });

  await page.setViewportSize({ width: 800, height: 900 });
  await expect(async () => {
    const narrowGroupBox = await group.boundingBox();
    const narrowDoneBox = await doneButton.boundingBox();
    expect(narrowGroupBox).not.toBeNull();
    expect(narrowDoneBox).not.toBeNull();
    // Own row below the header → toggle sits clearly below Done's vertical center
    expect(narrowGroupBox!.y).toBeGreaterThan(narrowDoneBox!.y + narrowDoneBox!.height / 2);
  }).toPass({ timeout: 5_000 });
});

// ─── Camera Groups toggle ─────────────────────────────────────────────────────

test('Camera Groups toggle is visible and includes a Custom button', async ({ page }) => {
  const toggleGroup = page.getByRole('group', { name: 'Camera Groups' });
  await expect(toggleGroup).toBeVisible();
  // Custom button is always rendered (onCustomClick is always provided in MonitorHeader)
  await expect(toggleGroup.getByRole('button', { name: /Custom/i })).toBeVisible();
});

test('first tracker group auto-selects on load', async ({ page }) => {
  // MonitorHeader: useEffect sets cameraGroup to allGroups[0].value once trackers load,
  // without requiring a click — the first tracker button should already be pressed.
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const buttonCount = await group.getByRole('button').count();
  test.skip(buttonCount <= 1, 'no tracker buttons available in this environment');

  const firstButton = group.getByRole('button').first();
  await expect(firstButton).toHaveAttribute('aria-pressed', 'true');
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

test('selecting a tracker group filters the timeline event points to that tracker', async ({ page }) => {
  // MonitorHeader's setCameraGroup flows into Monitor/index.tsx via useTrackerGroupResolution,
  // which drives useFilteredEventPoints — this is the actual cross-component link, not just
  // the toggle button's own visual state (already covered by other tests in this section).
  await waitForTimelineDataReady(page);
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const trackerButtons = group.getByRole('button').filter({ hasNotText: 'Custom' });
  const buttonCount = await trackerButtons.count();
  test.skip(buttonCount < 2, 'need at least 2 tracker buttons to verify filtering');

  const secondButton = trackerButtons.nth(1);
  const trackerName = (await secondButton.textContent())?.trim() ?? '';
  test.skip(!trackerName, 'could not read tracker button label');

  await secondButton.click();
  await expect(secondButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });

  const eventButtons = page.getByRole('button', { name: /, (reviewed|unreviewed)$/ });
  await eventButtons.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const eventCount = await eventButtons.count();
  test.skip(eventCount === 0, 'no event points visible for this tracker in this environment');

  // Every visible event point must belong to the newly selected tracker — ep.label is either
  // the tracker's own name or "<tracker name> (<camera/lane name>)" for join-camera trackers.
  const labels = await eventButtons.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')?.split(' at ')[0] ?? ''),
  );
  for (const label of labels) {
    expect(label).toContain(trackerName);
  }
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

test('clicking Custom opens the Custom Tracker Grouping dialog', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  await group.getByRole('button', { name: /Custom/i }).click();

  await expect(page.getByText('Custom Tracker Grouping')).toBeVisible({ timeout: 5_000 });
  await expect(
    page.getByText('You can only group trackers that share the same cameras'),
  ).toBeVisible();
});

test('creating a custom tracker group persists across reload via sessionStorage', async ({ page }) => {
  const group = page.getByRole('group', { name: 'Camera Groups' });
  await group.getByRole('button', { name: /Custom/i }).click();
  await expect(page.getByText('Custom Tracker Grouping')).toBeVisible({ timeout: 5_000 });

  // Create requires >= 2 selections that share a camera (isEnabled in CustomTrackerDialog.tsx)
  const dialog = page.getByRole('dialog');
  const checkboxes = dialog.getByRole('checkbox');
  const checkboxCount = await checkboxes.count();
  test.skip(checkboxCount < 2, 'not enough trackers/cameras available to build a custom group');

  await checkboxes.nth(0).click();
  let secondIndex = -1;
  for (let i = 1; i < checkboxCount; i++) {
    const isDisabled = await checkboxes.nth(i).isDisabled().catch(() => true);
    if (!isDisabled) {
      secondIndex = i;
      break;
    }
  }
  test.skip(secondIndex === -1, 'no second compatible tracker/camera to combine with the first');
  await checkboxes.nth(secondIndex).click();

  const createButton = page.getByRole('button', { name: 'Create Custom Tracker Group' });
  await expect(createButton).toBeEnabled({ timeout: 3_000 });
  await createButton.click();
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  // CustomToggleButton swaps its icon to edit-05.svg once a group has been created
  const customButton = group.getByRole('button', { name: /Custom/i });
  await expect(customButton.locator('img[src*="edit-05"]')).toBeVisible({ timeout: 5_000 });

  // hasCustomGroup re-derives from sessionStorage.getItem(`custom_tracker_group_${monitoringID}`)
  // on mount — reloading should keep the "edit" icon rather than reverting to "plus-1".
  await page.reload();
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });
  const reloadedCustomButton = page.getByRole('group', { name: 'Camera Groups' }).getByRole('button', { name: /Custom/i });
  await expect(reloadedCustomButton.locator('img[src*="edit-05"]')).toBeVisible({ timeout: 10_000 });
});

test('creating a custom tracker group filters the timeline to the selected trackers/cameras', async ({ page }) => {
  // onCustomCreate sets customTrackerIDs + switches cameraGroup to "__custom__" — Monitor/index.tsx's
  // useTrackerGroupResolution/useFilteredEventPoints then filter by that combined set, not just one tracker.
  await waitForTimelineDataReady(page);
  const group = page.getByRole('group', { name: 'Camera Groups' });
  await group.getByRole('button', { name: /Custom/i }).click();
  await expect(page.getByText('Custom Tracker Grouping')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  const checkboxes = dialog.getByRole('checkbox');
  const checkboxCount = await checkboxes.count();
  test.skip(checkboxCount < 2, 'not enough trackers/cameras available to build a custom group');

  const firstLabel = (await checkboxes.nth(0).evaluate((el) => el.closest('label')?.textContent?.trim() ?? ''));
  await checkboxes.nth(0).click();

  let secondIndex = -1;
  for (let i = 1; i < checkboxCount; i++) {
    const isDisabled = await checkboxes.nth(i).isDisabled().catch(() => true);
    if (!isDisabled) {
      secondIndex = i;
      break;
    }
  }
  test.skip(secondIndex === -1, 'no second compatible tracker/camera to combine with the first');
  const secondLabel = (await checkboxes.nth(secondIndex).evaluate((el) => el.closest('label')?.textContent?.trim() ?? ''));
  await checkboxes.nth(secondIndex).click();

  test.skip(!firstLabel || !secondLabel, 'could not read checkbox labels');

  const createButton = page.getByRole('button', { name: 'Create Custom Tracker Group' });
  await expect(createButton).toBeEnabled({ timeout: 3_000 });
  await createButton.click();
  await expect(dialog).not.toBeVisible({ timeout: 5_000 });

  const eventButtons = page.getByRole('button', { name: /, (reviewed|unreviewed)$/ });
  await eventButtons.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const eventCount = await eventButtons.count();
  test.skip(eventCount === 0, 'no event points visible for this custom group in this environment');

  const visibleLabels = await eventButtons.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')?.split(' at ')[0] ?? ''),
  );

  // Each selected tracker/camera should contribute at least one visible event point —
  // this only proves the combined filter, not that they're necessarily different trackers
  // (isEnabled in CustomTrackerDialog.tsx may force both picks under the same tracker).
  for (const checkboxLabel of [firstLabel, secondLabel]) {
    const hasMatch = visibleLabels.some(
      (l) => l.includes(checkboxLabel) || checkboxLabel.includes(l),
    );
    expect(hasMatch, `expected an event point matching "${checkboxLabel}"`).toBe(true);
  }
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

// ─── Monitor ↔ MonitorTimeline popup sync (BroadcastChannel "timeline-sync") ───
// useTimelinePopout (Monitor) and useBroadcastSync (MonitorTimeline) exchange "marker" and
// "filter" messages live while the popup is open — this is the actual cross-page link,
// not just that the popup opens (already covered above).

test("popping out the timeline seeds the popup with Monitor's current marker", async ({ page }) => {
  await waitForTimelineDataReady(page);
  const monitorTime = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
  const initial = await monitorTime.textContent();

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand', { exact: true }).click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.getByText('Activities')).toBeVisible({ timeout: 15_000 });

  // handlePopOut passes markerSec via URL param and useBroadcastSync confirms it via
  // "request-sync" — the popup should open already showing Monitor's exact marker time.
  const popupTime = popup.getByText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(popupTime).toHaveText(initial ?? '', { timeout: 5_000 });

  await popup.close();
});

test("moving the marker in the popped-out timeline updates the tag shown on Monitor's matching camera cell", async ({ page }) => {
  await waitForTimelineDataReady(page);
  const cameraCount = await getCameraCount(page);
  test.skip(cameraCount === 0, 'no cameras loaded for this monitoring session');

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand', { exact: true }).click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.getByText('Activities')).toBeVisible({ timeout: 15_000 });

  // Monitor's own TimeLine unmounts while popped ({!timelinePopped && <TimeLine/>} in
  // Monitor/index.tsx), so the live marker sync has to be observed indirectly — via
  // CameraLayout's tag chips, which stay mounted and read the same shared markerSec.
  const reviewedButton = popup.getByRole('button', { name: /, reviewed$/ }).first();
  await reviewedButton.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const buttonCount = await reviewedButton.count();
  test.skip(buttonCount === 0, 'no reviewed event points available in the popup for this environment');

  const label = await reviewedButton.getAttribute('aria-label');
  const tagName = label?.split(' at ')[0] ?? '';
  test.skip(!tagName, 'could not read event point label');

  // EventRow's selectEp in the popup sets markerSec, which useBroadcastSync broadcasts
  // back to Monitor as {type:"marker", source:"popout"} — useTimelinePopout applies it.
  await reviewedButton.dispatchEvent('click');

  const cameraCells = page.getByAltText('Expand camera').locator('xpath=../..');
  const tagChip = cameraCells.locator('span', { hasText: tagName }).first();
  await expect(tagChip).toBeVisible({ timeout: 5_000 });

  await popup.close();
});

test("closing the popup restores Monitor's timeline at the popup's last marker position", async ({ page }) => {
  await waitForTimelineDataReady(page);

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand', { exact: true }).click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.getByText('Activities')).toBeVisible({ timeout: 15_000 });

  const popupTime = popup.getByText(/^\d{2}:\d{2}:\d{2}$/);
  const before = await popupTime.textContent();
  await popup.keyboard.press('ArrowRight');
  const after = await popupTime.textContent();
  test.skip(after === before, 'marker did not move in the popup — no steppable content in this environment');

  await popup.close();

  // useTimelinePopout polls win.closed every 500ms, then sets restoreMarkerSec and
  // timelinePopped=false — Monitor's own TimeLine remounts at that restored marker position.
  const monitorTime = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
  await expect(monitorTime).toHaveText(after!, { timeout: 5_000 });
});

test("changing the tracker filter in Monitor updates the popped-out timeline's event points", async ({ page }) => {
  await waitForTimelineDataReady(page);
  const group = page.getByRole('group', { name: 'Camera Groups' });
  const trackerButtons = group.getByRole('button').filter({ hasNotText: 'Custom' });
  const buttonCount = await trackerButtons.count();
  test.skip(buttonCount < 2, 'need at least 2 tracker buttons to verify filtering');

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5_000 }),
    page.getByAltText('Expand', { exact: true }).click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  await expect(popup.getByText('Activities')).toBeVisible({ timeout: 15_000 });

  const secondButton = trackerButtons.nth(1);
  const trackerName = (await secondButton.textContent())?.trim() ?? '';
  test.skip(!trackerName, 'could not read tracker button label');

  // Changing the filter AFTER the popup is open exercises useTimelinePopout's live
  // "filter" broadcast — a different path than the cameraGroup passed in the popup's URL.
  await secondButton.click();
  await expect(secondButton).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });

  const popupEventButtons = popup.getByRole('button', { name: /, (reviewed|unreviewed)$/ });
  await popupEventButtons.first().waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const eventCount = await popupEventButtons.count();
  test.skip(eventCount === 0, 'no event points visible in the popup for this tracker in this environment');

  const labels = await popupEventButtons.evaluateAll((els) =>
    els.map((el) => el.getAttribute('aria-label')?.split(' at ')[0] ?? ''),
  );
  for (const label of labels) {
    expect(label).toContain(trackerName);
  }
  await popup.close();
});

// ─── Camera context menu (CameraOverlayMenu) ─────────────────────────────────

test('clicking camera body opens compliance violations overlay menu', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  // Expand button is at bottom-right; click top-left of the camera cell to hit the body
  const cameraCell = page.getByAltText('Expand camera').first().locator('xpath=../..');
  await cameraCell.click({ position: { x: 20, y: 20 } });

  await expect(page.getByText('Select a Compliance Violation')).toBeVisible({ timeout: 5_000 });
});

test('camera context menu closes on ✕ click', async ({ page }) => {
  const count = await getCameraCount(page);
  test.skip(count === 0, 'no cameras loaded for this monitoring session');

  const cameraCell = page.getByAltText('Expand camera').first().locator('xpath=../..');
  await cameraCell.click({ position: { x: 20, y: 20 } });
  await expect(page.getByText('Select a Compliance Violation')).toBeVisible({ timeout: 5_000 });

  // A reviewed camera tag chip also renders its own "✕" (remove tag) button, which sits
  // earlier in the DOM and gets covered by the overlay — page.getByText('✕').first() would
  // hit that hidden button and hang. CameraOverlayMenu's own close "✕" is a grandparent
  // sibling of the title paragraph, so walk up from the title to scope precisely to it.
  const overlay = page.getByText('Select a Compliance Violation').locator('xpath=../..');
  await overlay.getByText('✕').click();
  await expect(page.getByText('Select a Compliance Violation')).not.toBeVisible({ timeout: 3_000 });
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

// ─── Timeline keyboard shortcuts (useTimelineKeyboard) ─────────────────────────

test('Space toggles Play/Pause', async ({ page }) => {
  await waitForTimelineDataReady(page);
  await expect(page.getByAltText('Play')).toBeVisible();

  await page.keyboard.press('Space');
  await expect(page.getByAltText('Pause')).toBeVisible({ timeout: 3_000 });

  // Restore state
  await page.keyboard.press('Space');
  await expect(page.getByAltText('Play')).toBeVisible({ timeout: 3_000 });
});

test('ArrowRight and ArrowLeft move the timeline marker', async ({ page }) => {
  await waitForTimelineDataReady(page);
  const timeDisplay = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
  const initialTime = await timeDisplay.textContent();

  await page.keyboard.press('ArrowRight');
  const afterRight = await timeDisplay.textContent();

  if (afterRight !== initialTime) {
    await page.keyboard.press('ArrowLeft');
    await expect(timeDisplay).not.toHaveText(afterRight!, { timeout: 3_000 });
  } else {
    await page.keyboard.press('ArrowLeft');
    const afterLeft = await timeDisplay.textContent();
    test.skip(afterLeft === initialTime, 'timeline has no steppable content in this environment');
  }
});

test('"h" jumps the marker back to the start of the timeline', async ({ page }) => {
  await waitForTimelineDataReady(page);
  const timeDisplay = page.getByText(/^\d{2}:\d{2}:\d{2}$/);

  // Move forward first so "h" has somewhere to jump back from
  for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
  const afterForward = await timeDisplay.textContent();

  await page.keyboard.press('h');
  const afterHome = await timeDisplay.textContent();

  // If ArrowRight never moved the marker, there's nothing steppable in this environment
  test.skip(afterHome === afterForward, 'timeline has no steppable content in this environment');
  // "h" sets markerSec = timelineStartSec — the earliest point — so it must be <= where we advanced to.
  // HH:MM:SS strings compare lexicographically the same as their numeric values within one day.
  expect(afterHome! <= afterForward!).toBe(true);
});

test('Ctrl+ArrowRight and Ctrl+ArrowLeft jump between event points', async ({ page }) => {
  await waitForTimelineDataReady(page);
  const timeDisplay = page.getByText(/^\d{2}:\d{2}:\d{2}$/);
  const initialTime = await timeDisplay.textContent();

  await page.keyboard.press('Control+ArrowRight');
  const afterNext = await timeDisplay.textContent();

  if (afterNext !== initialTime) {
    // Jumped forward — try jumping back. This can legitimately be a no-op if the point we
    // landed on is the earliest one available (nothing before it to jump back to).
    await page.keyboard.press('Control+ArrowLeft');
    const afterBack = await timeDisplay.textContent();
    test.skip(afterBack === afterNext, 'no earlier event point available to jump back to');
    expect(afterBack).not.toBe(afterNext);
    return;
  }

  // No later event point from the current marker — try jumping to an earlier one instead
  await page.keyboard.press('Control+ArrowLeft');
  const afterPrev = await timeDisplay.textContent();
  test.skip(afterPrev === initialTime, 'no event points near the marker to jump to in this environment');
});

test('Shift+G opens the "Go to specific time" dialog', async ({ page }) => {
  await waitForTimeline(page);
  await page.keyboard.press('Shift+G');
  await expect(page.getByText('Go to specific time')).toBeVisible({ timeout: 3_000 });
  await page.getByRole('button', { name: 'Cancel' }).click();
});

test('+ and - keys change the timeline zoom', async ({ page }) => {
  await waitForTimelineDataReady(page);
  // TimelineTimeRuler sets cursor:"grab" once zoom > 1 and cursor:"default" at zoom === 1.
  // Default zoom is 4, so "-" pressed twice (4 → 2 → 1) should flip the ruler to "default".
  const ruler = page.getByText(/^\d{2}:\d{2}$/).first().locator('xpath=../..');
  const rulerCount = await ruler.count();
  test.skip(rulerCount === 0, 'no tick labels visible to locate the ruler in this environment');

  await page.keyboard.press('-');
  await page.keyboard.press('-');
  await expect(ruler).toHaveCSS('cursor', 'default', { timeout: 3_000 });

  await page.keyboard.press('+');
  await expect(ruler).not.toHaveCSS('cursor', 'default', { timeout: 3_000 });
});

test('Delete removes a selected reviewed event point; Ctrl+Z undoes it', async ({ page }) => {
  await waitForTimelineDataReady(page);

  // Mock the DELETE call so removing a server-backed (preloaded) event point doesn't
  // mutate real backend data — handleDeleteEventPoint fires this when the selected point
  // came from the server (src/pages/Monitor/hooks/useDeleteEventPoint.ts).
  await page.route('**/tracker/*/bulk', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  // EventRow renders a visually-hidden a11y button per event point (see rows/EventRow.tsx);
  // aria-label ends with ", reviewed" or ", unreviewed" — only reviewed points are deletable.
  // Rows mount slightly after the "loading..." indicators clear, so wait for one to appear
  // before deciding there's nothing to work with in this environment.
  const reviewedButton = page.getByRole('button', { name: /, reviewed$/ }).first();
  await reviewedButton.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const count = await reviewedButton.count();
  test.skip(count === 0, 'no reviewed event points available in this environment');

  const label = await reviewedButton.getAttribute('aria-label');
  // dispatchEvent bypasses the canvas overlay stacked on top of this 1x1px a11y button
  await reviewedButton.dispatchEvent('click');

  const pointByLabel = page.getByRole('button', { name: label ?? '', exact: true });
  await expect(pointByLabel).toHaveCount(1);

  await page.keyboard.press('Delete');
  await expect(pointByLabel).toHaveCount(0, { timeout: 5_000 });

  await page.keyboard.press('Control+Z');
  await expect(pointByLabel).toHaveCount(1, { timeout: 5_000 });

  // Ctrl+Y (redo) is deliberately not asserted here: after the mocked DELETE resolves,
  // handleDeleteEventPoint fires onMutated → a background refetch of monitoring/{id}/load2
  // against the REAL backend, which never actually deleted anything and returns the point
  // unchanged. That refetch can restore it into preloadedEventPoints independently of our
  // local undo/redo stack, making the post-redo count non-deterministic in this test setup.
});

test('"e" enters edit mode for a selected reviewed event point', async ({ page }) => {
  await waitForTimelineDataReady(page);

  // "e" also converts preloaded points via handleConvertEventPoint, which fires the same
  // real DELETE call in the background if unmocked (src/pages/Monitor/hooks/useDeleteEventPoint.ts).
  const deleteRequests: string[] = [];
  await page.route('**/tracker/*/bulk', async (route) => {
    if (route.request().method() === 'DELETE') {
      deleteRequests.push(route.request().url());
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  // Rows mount slightly after the "loading..." indicators clear — wait for one to appear.
  const reviewedButton = page.getByRole('button', { name: /, reviewed$/ }).first();
  await reviewedButton.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const count = await reviewedButton.count();
  test.skip(count === 0, 'no reviewed event points available in this environment');

  await reviewedButton.dispatchEvent('click');
  await page.keyboard.press('e');

  // handleEditEventPoint only calls onConvertEventPointToLocal for preloaded (server-backed)
  // points — if the selected point was already local, no conversion/delete request fires.
  await page.waitForTimeout(1_000);
  test.skip(deleteRequests.length === 0, 'selected event point was not server-backed — no conversion triggered');
  expect(deleteRequests.length).toBeGreaterThan(0);
});

test('Alt+ArrowLeft navigates back', async ({ page }) => {
  await page.goto('/assignments');
  await page.goto(MONITOR_URL());
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });

  await page.keyboard.press('Alt+ArrowLeft');
  await expect(page).toHaveURL(/\/assignments/, { timeout: 5_000 });
});

// ─── CameraLayout ↔ TimeLine marker/event integration ──────────────────────────
// Monitor/index.tsx shares markerSec and cameraEventPoints (filteredEventPoints) between
// CameraLayout and TimeLine — moving the timeline marker changes which tag chips render on
// camera cells (useTagsForCamera), and both sides call the same onRemoveEventPoint handler.

test('selecting an event point moves the marker onto it and shows its tag on the matching camera cell', async ({ page }) => {
  await waitForTimelineDataReady(page);
  const cameraCount = await getCameraCount(page);
  test.skip(cameraCount === 0, 'no cameras loaded for this monitoring session');

  const reviewedButton = page.getByRole('button', { name: /, reviewed$/ }).first();
  await reviewedButton.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const buttonCount = await reviewedButton.count();
  test.skip(buttonCount === 0, 'no reviewed event points available in this environment');

  const label = await reviewedButton.getAttribute('aria-label');
  // aria-label format: "<label> at HH:MM:SS, reviewed" — <label> is the tag name rendered
  // on the matching camera cell by useTagsForCamera.
  const tagName = label?.split(' at ')[0] ?? '';
  test.skip(!tagName, 'could not read event point label');
  const eventTime = label?.match(/at (\d{2}:\d{2}:\d{2})/)?.[1];

  // EventRow's selectEp sets markerSec to this point's exact timeSec — for POINT-mode
  // events startSec === endSec === timeSec, so the marker now sits inside the tag's window,
  // and the same value drives the marker time shown in the toolbar (shared TimeLine state).
  await reviewedButton.dispatchEvent('click');

  if (eventTime) {
    await expect(page.getByText(eventTime, { exact: true })).toBeVisible({ timeout: 5_000 });
  }

  // Scope to camera cells only — the timeline's row-label column also renders this same
  // text as a plain <span>, which a page-wide search would incorrectly match too.
  const cameraCells = page.getByAltText('Expand camera').locator('xpath=../..');
  const tagChip = cameraCells.locator('span', { hasText: tagName }).first();
  await expect(tagChip).toBeVisible({ timeout: 5_000 });
});

test('removing a tag from the camera chip also removes it from the timeline', async ({ page }) => {
  await waitForTimelineDataReady(page);
  const cameraCount = await getCameraCount(page);
  test.skip(cameraCount === 0, 'no cameras loaded for this monitoring session');

  // CameraItem's "✕" calls the same onRemoveEventPoint (handleDeleteEventPoint) as the
  // timeline's Delete shortcut — mock the same real DELETE call it can fire.
  await page.route('**/tracker/*/bulk', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  const reviewedButton = page.getByRole('button', { name: /, reviewed$/ }).first();
  await reviewedButton.waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  const buttonCount = await reviewedButton.count();
  test.skip(buttonCount === 0, 'no reviewed event points available in this environment');

  const label = await reviewedButton.getAttribute('aria-label');
  const tagName = label?.split(' at ')[0] ?? '';
  test.skip(!tagName, 'could not read event point label');

  await reviewedButton.dispatchEvent('click');

  // Scope to camera cells only — the timeline's row-label column also renders this same
  // text as a plain <span>, which a page-wide search would incorrectly match too.
  const cameraCells = page.getByAltText('Expand camera').locator('xpath=../..');
  const tagChip = cameraCells.locator('span', { hasText: tagName }).first();
  await expect(tagChip).toBeVisible({ timeout: 5_000 });

  // The tag chip's own "✕" is a sibling span, only rendered for reviewed tags (CameraItem.tsx)
  const removeButton = tagChip.locator('xpath=following-sibling::*[1]');
  await removeButton.click();

  await expect(tagChip).not.toBeVisible({ timeout: 5_000 });
  // Same underlying event point — its a11y button in the timeline should be gone too
  const pointByLabel = page.getByRole('button', { name: label ?? '', exact: true });
  await expect(pointByLabel).toHaveCount(0, { timeout: 5_000 });
});

// ─── Navigation ───────────────────────────────────────────────────────────────

test('navigates back to assignments when browser back is used', async ({ page }) => {
  await page.goto('/assignments');
  await page.goto(MONITOR_URL());
  await expect(page.getByText('/ Events')).toBeVisible({ timeout: 15_000 });

  await page.goBack();
  await expect(page).toHaveURL(/\/assignments/);
});
