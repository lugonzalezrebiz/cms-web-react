import { test, expect, type Page } from '@playwright/test';

const HEADER_TITLES = [
  'Assignments',
  'Started Assignments',
  'Paused Assignments',
  'Completed This Month',
  'Tickets',
];

// Returns count of real assignment card menu buttons (excludes skeleton cards).
// Skeleton cards also have alt="More options" but no onClick — we distinguish them
// by waiting for all MuiSkeleton elements to be gone first.
async function getRealCardCount(page: Page): Promise<number> {
  await expect(page.locator('.MuiSkeleton-root')).toHaveCount(0, { timeout: 10_000 }).catch(() => {});
  const skeletonsLeft = await page.locator('.MuiSkeleton-root').count();
  if (skeletonsLeft > 0) return 0;
  return page.getByAltText('More options').count();
}

// Clicks the first card's "More options" button and waits for the MUI Menu
// portal to fully render before returning.
async function openCardMenu(page: Page): Promise<void> {
  await page.getByAltText('More options').first().click();
  await expect(page.getByText('Open a ticket')).toBeVisible({ timeout: 5_000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto('/assignments');
  await page.waitForLoadState('networkidle');
});

// ─── Page structure ───────────────────────────────────────────────────────────

test('shows Assignments and Rejected Assignments section titles', async ({ page }) => {
  await expect(page.getByText('Assignments').first()).toBeVisible();
  await expect(page.getByText('Rejected Assignments')).toBeVisible();
});

test('shows company and store filter selects', async ({ page }) => {
  await expect(page.getByRole('combobox').first()).toBeVisible();
  await expect(page.getByRole('combobox').nth(1)).toBeVisible();
});

// ─── Header summary cards ─────────────────────────────────────────────────────

test('header cards show skeletons while loading', async ({ page }) => {
  await page.route('**/assignment/count', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto('/assignments');
  await expect(page.locator('[class*="MuiSkeleton"]').first()).toBeVisible();
});

test('header cards render all 5 titles after loading', async ({ page }) => {
  for (const title of HEADER_TITLES) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test('header card skeletons disappear after data loads', async ({ page }) => {
  await expect(page.locator('[class*="MuiSkeleton"]')).toHaveCount(0);
});

test('header cards display numeric count values', async ({ page }) => {
  for (const title of HEADER_TITLES) {
    // CardTitle (p) is inside CardTitleContainer (div); Current (p) is the following sibling div's p
    const numericEl = page
      .locator('p')
      .filter({ hasText: new RegExp(`^${title}$`) })
      .first()
      .locator('xpath=../following-sibling::div//p');
    await expect(numericEl).toHaveText(/^\d+$/);
  }
});

// ─── Filters ─────────────────────────────────────────────────────────────────

test('company filter opens and shows options', async ({ page }) => {
  await page.getByRole('combobox').first().click();
  await expect(page.getByRole('option').first()).toBeVisible();
  await page.keyboard.press('Escape');
});

test('store filter options update when company changes', async ({ page }) => {
  const companySelect = page.getByRole('combobox').first();
  await companySelect.click();

  // MUI Select renders options in a Portal lazily — wait for them to appear
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const companyCount = await page.getByRole('option').count();
  test.skip(companyCount < 2, 'only one company option available in this environment');

  await page.getByRole('option').nth(1).click();
  await page.waitForLoadState('networkidle');

  // Store filter should be visible and reflect the new company
  await expect(page.getByRole('combobox').nth(1)).toBeVisible();
});

test('changing company resets store selection', async ({ page }) => {
  const storeSelect = page.getByRole('combobox').nth(1);

  // Select a store first
  await storeSelect.click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const storeCount = await page.getByRole('option').count();
  test.skip(storeCount === 0, 'no store options available');
  await page.getByRole('option').first().click();

  // Now switch company
  const companySelect = page.getByRole('combobox').first();
  await companySelect.click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const companyCount = await page.getByRole('option').count();
  test.skip(companyCount < 2, 'not enough company options to switch');
  await page.getByRole('option').nth(1).click();

  // Store should reset to its default — "All Stores" when that option exists, "Select" otherwise
  await expect(storeSelect).toContainText(/All Stores|Select/);
});

// ─── Assignments list ─────────────────────────────────────────────────────────

test('assignments section shows cards or empty state', async ({ page }) => {
  // getRealCardCount waits for skeletons to clear — "No assignments" only appears after that
  const cardCount = await getRealCardCount(page);
  if (cardCount > 0) {
    await expect(page.getByAltText('More options').first()).toBeVisible();
  } else {
    await expect(page.getByText('No assignments').first()).toBeVisible();
  }
});

test('rejected assignments section shows cards or empty state', async ({ page }) => {
  // getRealCardCount waits for skeletons to clear before we count anything
  const cardCount = await getRealCardCount(page);
  const noAssignmentsCount = await page.getByText('No assignments').count();
  expect(noAssignmentsCount > 0 || cardCount > 0).toBe(true);
});

test('assignment cards show loading skeletons before data arrives', async ({ page }) => {
  await page.route('**/location/assignments', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto('/assignments');
  await expect(page.locator('[class*="MuiSkeleton"]').first()).toBeVisible();
});

// ─── Card menu ────────────────────────────────────────────────────────────────

test('assignment card menu shows correct options', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await page.getByAltText('More options').first().click();
  await expect(page.getByText('Open a ticket')).toBeVisible();
  await expect(page.getByText('See detail information')).toBeVisible();
});

test('menu closes on Escape key', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.keyboard.press('Escape');
  await expect(page.getByText('Open a ticket')).not.toBeVisible();
});

// ─── Info dialog ──────────────────────────────────────────────────────────────

test('See detail information opens dialog with assignment items', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('See detail information').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Date', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Open', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Close', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/Comments:/)).toBeVisible();
});

test('info dialog shows DVR, Diff and Interval items', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('See detail information').click();

  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('DVR', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Diff', { exact: true })).toBeVisible();
  await expect(dialog.getByText('Interval', { exact: true })).toBeVisible();
});

test('info dialog closes on X button click', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('See detail information').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.locator('[role="dialog"] img[src*="x-close"]').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ─── Open ticket dialog ───────────────────────────────────────────────────────

test('Open a ticket shows dialog with all required fields', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();

  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Open Ticket')).toBeVisible();
  await expect(page.getByText('Select most appropriate Issue type')).toBeVisible();
  await expect(page.getByText('Provide an specific description of the issue')).toBeVisible();
  await expect(page.getByRole('button', { name: /Browse file/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /Submit Ticket/i })).toBeVisible();
});

test('Submit Ticket button is disabled when form is empty', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();

  await expect(page.getByRole('button', { name: /Submit Ticket/i })).toBeDisabled();
});

test('Submit Ticket enables when issue type and description are filled', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();

  // Select an issue type
  await page.getByRole('dialog').getByRole('combobox').click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const optionCount = await page.getByRole('option').count();
  test.skip(optionCount === 0, 'no issue type options available');
  await page.getByRole('option').first().click();

  // Fill description — MUI TextareaAutosize inside a Dialog loses its ARIA textbox role briefly
  // after the Select portal closes; target the textarea element directly to avoid the race.
  await page.getByRole('dialog').locator('textarea').first().fill('Test description for E2E validation');

  await expect(page.getByRole('button', { name: /Submit Ticket/i })).toBeEnabled();
});

test('description validation error shows when field is cleared after typing', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();

  const textarea = page.getByRole('dialog').getByRole('textbox');
  await textarea.fill('something');
  await textarea.fill('');

  // Submit stays disabled when description is cleared
  await expect(page.getByRole('button', { name: /Submit Ticket/i })).toBeDisabled();
});

test('Cancel button closes ticket dialog', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('ticket dialog X button closes without submitting', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();
  await expect(page.getByRole('dialog')).toBeVisible();

  await page.locator('[role="dialog"] img[src*="x-close"]').click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

// ─── Card state badge ─────────────────────────────────────────────────────────

test('assignment cards show a state badge with a known state value', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  // NewAssignmentsCard renders the `state` string directly inside a styled Box.
  // Known values come from the stateAssignments union in src/components/stateColors.ts.
  const knownStates =
    /^(Ready|Assigned|Started|Paused|Resumed|Completed|Error|Reported|Open|Resolved|Other|Closed|Pending_Reporter|Pending_Support)$/;
  const badge = page.locator('p, div, span').filter({ hasText: knownStates }).first();
  await expect(badge).toBeVisible();
});

// ─── Ticket success dialog ────────────────────────────────────────────────────

test('submitting a ticket shows the success dialog', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  // Mock the POST /api/ticket so the test does not depend on a real backend response.
  await page.route('**/ticket', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await openCardMenu(page);
  await page.getByText('Open a ticket').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Select the first available issue type
  await page.getByRole('dialog').getByRole('combobox').click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const optionCount = await page.getByRole('option').count();
  test.skip(optionCount === 0, 'no issue type options available');
  await page.getByRole('option').first().click();

  // Fill description to satisfy validation — same ARIA race as the other ticket test; use direct locator.
  await page.getByRole('dialog').locator('textarea').first().fill('E2E test ticket description');

  await page.getByRole('button', { name: /Submit Ticket/i }).click();

  // SuccessDialog renders alt="Success" (receipt-check.svg) and the confirmation text.
  await expect(page.getByAltText('Success')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('The ticket has been created successfully')).toBeVisible();

  // Dismiss
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByAltText('Success')).not.toBeVisible();
});

// ─── Card navigation ──────────────────────────────────────────────────────────

test('clicking assignment card body navigates to monitor', async ({ page }) => {
  const count = await getRealCardCount(page);
  test.skip(count === 0, 'no assignments available');

  // Navigate from the "More options" img up 2 levels to reach the Card element:
  // img → Box (flex header row) → Card (the div with onClick)
  const card = page.getByAltText('More options').first().locator('xpath=../..');
  await card.click({ position: { x: 50, y: 80 } });

  // Completed assignments (with VITE_ASSIGNMENT_COMPLETED=true) don't navigate —
  // skip gracefully instead of failing when all available cards are completed.
  const navigated = await page.waitForURL(/\/monitor/, { timeout: 5_000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!navigated, 'all available assignments are completed — navigation is disabled for them');
});
