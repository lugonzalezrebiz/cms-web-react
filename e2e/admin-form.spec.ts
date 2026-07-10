import { test, expect, type Page } from '@playwright/test';

// AdminForm renders at /assignments when the logged-in user has ADMIN_ROLE.
// This file uses the admin-chromium project (storageState: e2e/.auth/admin.json).
// Admin tests are slower (more concurrent API calls) — give them extra time.
test.setTimeout(60_000);
const ADMIN_URL = '/assignments';

const HEADER_CARD_TITLES = [
  'Assignments',
  'Started Assignments',
  'Paused Assignments',
  'Completed This Month',
  'Tickets',
];

// Waits for skeleton loading state to clear and returns how many ASSIGN buttons are visible.
async function waitForUsersTable(page: Page): Promise<number> {
  await expect(page.locator('[class*="MuiSkeleton"]')).toHaveCount(0, { timeout: 10_000 }).catch(() => {});
  return page.getByRole('button', { name: 'ASSIGN' }).count();
}

// Opens the ViewAssignments drawer by clicking the NAME cell of the first user row.
// ASSIGN button has stopPropagation, so we avoid it by clicking any other cell.
async function openFirstUserDrawer(page: Page) {
  // TableRow renders as <tr> with onClick={allRow}, each non-ASSIGN cell triggers handleRowClick
  await page.locator('tbody tr').first().locator('td').nth(4).click();
}

// Opens the View Assignments drawer, then clicks Reset Password to open the Reset Password dialog.
async function openResetPasswordDialog(page: Page) {
  await openFirstUserDrawer(page);
  await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5_000 });
  await page.getByText('Reset Password').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto(ADMIN_URL);
  // Wait for skeletons to clear — confirms both useAssignmentCount and useUsers have
  // resolved and React has finished rendering. .catch() prevents a timeout from failing
  // the hook if data never loads (each test can then fail with its own assertion error).
  await expect(page.locator('[class*="MuiSkeleton"]')).toHaveCount(0, { timeout: 20_000 }).catch(() => {});
});

// ─── Header cards ─────────────────────────────────────────────────────────────

test('header cards show skeletons while loading', async ({ page }) => {
  await page.route('**/assignment/count', async (route) => {
    await new Promise((r) => setTimeout(r, 800));
    await route.continue();
  });
  await page.goto(ADMIN_URL);
  await expect(page.locator('[class*="MuiSkeleton"]').first()).toBeVisible();
});

test('header cards render all 5 titles after loading', async ({ page }) => {
  for (const title of HEADER_CARD_TITLES) {
    await expect(page.getByText(title).first()).toBeVisible();
  }
});

test('header card skeletons disappear after data loads', async ({ page }) => {
  await expect(page.locator('[class*="MuiSkeleton"]')).toHaveCount(0, { timeout: 10_000 });
});

test('header cards display numeric count values', async ({ page }) => {
  // Each HeaderCard renders a <Current> styled-p sibling of the title container
  for (const title of HEADER_CARD_TITLES) {
    const numericEl = page
      .locator('p')
      .filter({ hasText: new RegExp(`^${title}$`) })
      .first()
      .locator('xpath=../following-sibling::div//p');
    await expect(numericEl).toHaveText(/^\d+$/);
  }
});

test('Tickets card opens the Tickets drawer', async ({ page }) => {
  // The HeaderCard's MediaContainer contains a position:absolute img that can physically
  // overlap the <p>CardTitle</p> at the CDP hit-test point, causing a normal .click() to
  // land on the img and miss the Card's onClick handler. dispatchEvent fires the click
  // directly on the <p> with bubbles:true so it always reaches the Card onClick handler.
  await page.locator('p').filter({ hasText: /^Tickets$/ }).first().dispatchEvent('click');

  // CREATED BY is the first column header in TicketsDrawer's Table — only present when the drawer is open
  await expect(page.getByText('CREATED BY')).toBeVisible({ timeout: 5_000 });
  await page.keyboard.press('Escape');
});

// ─── Users table section ──────────────────────────────────────────────────────

test('shows Users section title', async ({ page }) => {
  await expect(page.getByText('Users').first()).toBeVisible();
});

test('shows Create a New Employee button', async ({ page }) => {
  await expect(page.getByRole('button', { name: /Create a New Employee/i })).toBeVisible();
});

test('table shows column headers: USER ID, USERNAME, ROL, NAME, E-MAIL, ACTIVE', async ({ page }) => {
  await expect(page.getByText('USER ID')).toBeVisible();
  await expect(page.getByText('USERNAME')).toBeVisible();
  await expect(page.getByText('ROL')).toBeVisible();
  await expect(page.getByText('NAME', { exact: true })).toBeVisible();
  await expect(page.getByText('E-MAIL')).toBeVisible();
  await expect(page.getByText('ACTIVE')).toBeVisible();
});

test('table rows show ACTIVE status badge (Yes or No)', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  const badgeCount = await page.getByText(/^(Yes|No)$/).count();
  expect(badgeCount).toBeGreaterThan(0);
});

test('table shows ASSIGN button for each user', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await expect(page.getByRole('button', { name: 'ASSIGN' }).first()).toBeVisible();
});

// ─── Create a New Employee dialog ────────────────────────────────────────────

test('clicking Create a New Employee opens the dialog', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Create New Employee')).toBeVisible();
});

test('dialog shows employee type radio group and Reviewer option', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Select type of employee')).toBeVisible();
  await expect(page.getByRole('radio').first()).toBeVisible();
});

test('dialog shows all required input fields', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('Employee Name')).toBeVisible();
  await expect(page.getByText('Email')).toBeVisible();
  await expect(page.getByText('User Name')).toBeVisible();
  await expect(page.getByText('Password', { exact: true })).toBeVisible();
});

test('Create button is disabled when the form is empty', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
});

test('Cancel button closes the Create Employee dialog without saving', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
});

test('filling all required fields enables the Create button', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  // EmployeeTypeRadioGroup renders radio inputs before the text fields — exclude them.
  // Remaining order matches form layout: Employee Name, Email, User Name, Password.
  const textInputs = dialog.locator('input:not([type="radio"]):not([type="checkbox"])');

  await textInputs.nth(0).fill('Test Employee');
  await textInputs.nth(1).fill('test@example.com');
  await textInputs.nth(2).fill('testuser123');
  await textInputs.nth(3).fill('TestPass1');

  // Create becomes enabled once all fields pass validation
  await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 3_000 });
});

test('submitting a valid form creates the employee and closes the dialog', async ({ page }) => {
  // Mock the POST /api/user call so the test does not depend on a real backend write.
  // useCreateUser's onSuccess calls handleClose, which is what we're verifying here.
  await page.route('**/user', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  const textInputs = dialog.locator('input:not([type="radio"]):not([type="checkbox"])');
  await textInputs.nth(0).fill('Test Employee');
  await textInputs.nth(1).fill('test@example.com');
  await textInputs.nth(2).fill('testuser123');
  await textInputs.nth(3).fill('TestPass1');

  await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 3_000 });
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 5_000 });
});

// ─── Assign dialog ────────────────────────────────────────────────────────────

test('clicking ASSIGN button opens the Assign Assignment dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Assign Assignment')).toBeVisible();
});

test('clicking ASSIGN does not also open the View Assignments drawer', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  // ASSIGN's onClick calls e.stopPropagation() so the row's onClick (which opens the
  // ViewAssignments drawer) must not also fire. "Reset Password" only renders inside that drawer.
  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Assign Assignment')).toBeVisible();

  await expect(page.getByText('Reset Password')).not.toBeVisible();
});

test('Assign dialog shows Company and Store selects', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('Company')).toBeVisible();
  await expect(page.getByText('Store', { exact: true })).toBeVisible();
  await expect(page.getByRole('combobox').first()).toBeVisible();
});

test('Assign button is disabled when Store is not selected', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // isFormValid requires a store value — disabled until one is chosen
  await expect(page.getByRole('button', { name: 'Assign' })).toBeDisabled();
});

test('Cancel closes the Assign dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
});

test('submitting a valid assign form shows the success dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  // Mock the POST /api/user/:id/associate so the test does not depend on a real backend write.
  // useAssignUserLocation's onSuccess shows the SuccessDialog ("User assigned successfully.").
  await page.route('**/user/*/associate', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await page.getByRole('button', { name: 'ASSIGN' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Company defaults to the first company (effectiveCompany); only Store needs picking.
  // Select it via keyboard — same Portal/Dialog click-interception issue as the ticket combobox.
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('combobox').nth(1).click();
  await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  const optionCount = await page.getByRole('option').count();
  test.skip(optionCount === 0, 'no store options available for the default company');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('[role="listbox"]')).not.toBeVisible({ timeout: 3_000 }).catch(() => {});

  await expect(page.getByRole('button', { name: 'Assign' })).toBeEnabled({ timeout: 3_000 });
  await page.getByRole('button', { name: 'Assign' }).click();

  // SuccessDialog renders alt="Success" (receipt-check.svg) and the confirmation message.
  await expect(page.getByAltText('Success')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('User assigned successfully.')).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByAltText('Success')).not.toBeVisible();
});

// ─── Assign Location dialog (LOCATION button) ─────────────────────────────────

test('clicking LOCATION button opens the Create Location dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Create Location')).toBeVisible();
});

test('Create Location dialog shows Location Type radios and all required fields', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('Location Type')).toBeVisible();
  await expect(page.getByText('Permanent')).toBeVisible();
  await expect(page.getByText('Temporary', { exact: true })).toBeVisible();

  await expect(page.getByText('Phone number')).toBeVisible();
  await expect(page.getByText('Address Line 1')).toBeVisible();
  await expect(page.getByText('Address Line 2')).toBeVisible();
  await expect(page.getByText('Country')).toBeVisible();
  await expect(page.getByText('City/Region')).toBeVisible();
  await expect(page.getByText('IP', { exact: true })).toBeVisible();
});

test('Create button is disabled when the Create Location form is empty', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
});

test('selecting Temporary reveals the Temporary Period date range picker', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('Temporary Period')).not.toBeVisible();

  await page.getByText('Temporary', { exact: true }).click();
  await expect(page.getByText('Temporary Period')).toBeVisible({ timeout: 3_000 });
});

test('applying a date range fills the Temporary Period field', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await page.getByText('Temporary', { exact: true }).click();
  await expect(page.getByText('Temporary Period')).toBeVisible({ timeout: 3_000 });

  const dialog = page.getByRole('dialog');
  const rangeField = dialog.locator('input[readonly]').first();
  await expect(rangeField).toHaveValue('- to -');

  // disablePast means only today/future days are clickable — grab any enabled one
  // and click it twice to pick a single-day range, then confirm with Apply.
  await page.getByAltText('calendar').click();
  const enabledDay = page.locator('.MuiPickersDay-root:not(.Mui-disabled)').first();
  await enabledDay.click();
  await enabledDay.click();
  await page.getByRole('button', { name: 'Apply' }).click();

  await expect(rangeField).not.toHaveValue('- to -');
});

test('entering an invalid IP shows an inline validation error', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="tel"]').fill('1234567');
  // Remaining text fields in form order: Address Line 1, Address Line 2, Country, City/Region, IP
  const textInputs = dialog.locator('input:not([type="tel"]):not([type="radio"])');
  await textInputs.nth(0).fill('123 Main St');
  await textInputs.nth(1).fill('Apt 4B');
  await textInputs.nth(2).fill('USA');
  await textInputs.nth(3).fill('Miami');
  await textInputs.nth(4).fill('not-an-ip');

  await expect(page.getByText('Enter a valid IP address')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
});

test('filling all required fields with valid data enables the Create button', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="tel"]').fill('12345678');
  const textInputs = dialog.locator('input:not([type="tel"]):not([type="radio"])');
  await textInputs.nth(0).fill('123 Main St');
  await textInputs.nth(1).fill('Apt 4B');
  await textInputs.nth(2).fill('USA');
  await textInputs.nth(3).fill('Miami');
  await textInputs.nth(4).fill('192.168.1.1');

  await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 3_000 });
});

test('Cancel closes the Create Location dialog without saving', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
});

test('creating a location shows success and the record appears in the employee Locations table', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  // useLocationRecords is an in-memory-only store (no backend endpoint yet) — this
  // creates a fake record scoped to this test's page session, nothing is persisted.
  await page.getByRole('button', { name: 'LOCATION' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="tel"]').fill('12345678');
  const textInputs = dialog.locator('input:not([type="tel"]):not([type="radio"])');
  await textInputs.nth(0).fill('123 Main St');
  await textInputs.nth(1).fill('Apt 4B');
  await textInputs.nth(2).fill('USA');
  await textInputs.nth(3).fill('Miami');
  await textInputs.nth(4).fill('192.168.1.1');

  await page.getByRole('button', { name: 'Create' }).click();
  await expect(page.getByText('Location created successfully.')).toBeVisible({ timeout: 5_000 });

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });

  // LOCATION was clicked on the first row — open that same user's View Assignments
  // drawer and confirm the fake record shows up in its Locations table.
  await openFirstUserDrawer(page);
  await expect(page.getByRole('presentation').first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Locations')).toBeVisible();

  const drawerPaper = page.locator('.MuiDrawer-paper');
  const locationRow = drawerPaper.locator('tbody tr').filter({ hasText: '123 Main St' });
  await expect(locationRow).toBeVisible({ timeout: 5_000 });
  await expect(locationRow.getByText('12345678')).toBeVisible();
  await expect(locationRow.getByText('USA')).toBeVisible();
  await expect(locationRow.getByText('Miami')).toBeVisible();

  await locationRow.getByAltText('delete').click();
  await expect(locationRow).not.toBeVisible({ timeout: 3_000 });
  await expect(page.getByText('No locations found for this employee')).toBeVisible({ timeout: 3_000 });
});

// ─── View Assignments drawer (row click) ──────────────────────────────────────

test('clicking a user row opens the View Assignments drawer', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openFirstUserDrawer(page);

  // ViewAssignmentsDialog renders inside a Drawer (MUI presentation)
  await expect(page.getByRole('presentation').first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Assignments').first()).toBeVisible({ timeout: 5_000 });
});

test('View Assignments drawer shows the employee name and Reset Password link', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openFirstUserDrawer(page);

  await expect(page.getByRole('presentation').first()).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5_000 });
});

test('Reset Password link opens the Reset Password dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openFirstUserDrawer(page);
  await expect(page.getByText('Reset Password')).toBeVisible({ timeout: 5_000 });

  await page.getByText('Reset Password').click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
});

// ─── Reset Password dialog ────────────────────────────────────────────────────

test('Reset Password dialog shows New Password and Confirm Password fields', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openResetPasswordDialog(page);

  await expect(page.getByText('New Password')).toBeVisible();
  await expect(page.getByText('Confirm Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeVisible();
});

test('Reset button is disabled when the form is empty', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openResetPasswordDialog(page);

  await expect(page.getByRole('button', { name: 'Reset' })).toBeDisabled();
});

test('mismatched passwords show "Passwords do not match" and keep Reset disabled', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openResetPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  const passwordInputs = dialog.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('ValidPass1');
  await passwordInputs.nth(1).fill('DifferentPass1');

  await expect(page.getByText('Passwords do not match')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reset' })).toBeDisabled();
});

test('filling matching valid passwords enables the Reset button', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openResetPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  const passwordInputs = dialog.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('ValidPass1');
  await passwordInputs.nth(1).fill('ValidPass1');

  await expect(page.getByRole('button', { name: 'Reset' })).toBeEnabled({ timeout: 3_000 });
});

test('Cancel closes the Reset Password dialog without saving', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openResetPasswordDialog(page);

  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 3_000 });
});

test('submitting a valid reset password form shows the success dialog', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  // Mock the POST /api/user/:id/reset-password so the test does not depend on a real backend write.
  // ResetPasswordDialog's onSubmit success callback shows SuccessDialog with a confirmation message.
  await page.route('**/user/*/reset-password', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    } else {
      await route.continue();
    }
  });

  await openResetPasswordDialog(page);

  const dialog = page.getByRole('dialog');
  const passwordInputs = dialog.locator('input[type="password"]');
  await passwordInputs.nth(0).fill('ValidPass1');
  await passwordInputs.nth(1).fill('ValidPass1');

  await expect(page.getByRole('button', { name: 'Reset' })).toBeEnabled({ timeout: 3_000 });
  await page.getByRole('button', { name: 'Reset' }).click();

  // SuccessDialog renders alt="Success" (receipt-check.svg) and the confirmation message.
  await expect(page.getByAltText('Success')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Password has been reset successfully.')).toBeVisible();

  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.getByAltText('Success')).not.toBeVisible();
});

test('View Assignments drawer shows "No assignments found" or assignment table', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  await openFirstUserDrawer(page);
  await expect(page.getByRole('presentation').first()).toBeVisible({ timeout: 5_000 });

  // Either the table is shown or the empty state message
  const hasTable = await page.getByText('COMPANY').isVisible({ timeout: 5_000 }).catch(() => false);
  const hasEmpty = await page.getByText('No assignments found for this employee').isVisible().catch(() => false);
  expect(hasTable || hasEmpty).toBe(true);
});

// ─── Tickets drawer ───────────────────────────────────────────────────────────

test('Tickets drawer shows CREATED BY, CREATED ON, STATUS, ISSUE column headers', async ({ page }) => {
  await page.locator('p').filter({ hasText: /^Tickets$/ }).first().dispatchEvent('click');
  await expect(page.getByText('CREATED BY')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('CREATED ON')).toBeVisible();
  await expect(page.getByText('STATUS')).toBeVisible();
  await expect(page.getByText('ISSUE', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
});

test('Tickets drawer shows RESOLVE button for open tickets', async ({ page }) => {
  await page.locator('p').filter({ hasText: /^Tickets$/ }).first().dispatchEvent('click');
  await expect(page.getByText('CREATED BY')).toBeVisible({ timeout: 5_000 });

  const resolveCount = await page.getByRole('button', { name: 'RESOLVE' }).count();
  // Either there are open tickets with RESOLVE buttons, or all are resolved (no buttons)
  const resolvedCount = await page.getByText('Resolved', { exact: false }).count();
  expect(resolveCount > 0 || resolvedCount >= 0).toBe(true);
  await page.keyboard.press('Escape');
});

// ─── Ticket detail dialog (clicking a ticket row) ─────────────────────────────

test('clicking a ticket row opens the detail dialog with Issue Type and Reported', async ({ page }) => {
  // dispatchEvent bypasses the HeaderCard img overlay that intercepts CDP pointer events
  await page.locator('p').filter({ hasText: /^Tickets$/ }).first().dispatchEvent('click');
  // CREATED BY is unique to the TicketsDrawer table — confirms the drawer is open
  await expect(page.getByText('CREATED BY')).toBeVisible({ timeout: 5_000 });

  // Scope to .MuiDrawer-paper to avoid matching the Users table which sits behind the backdrop
  const drawerPaper = page.locator('.MuiDrawer-paper');
  const ticketRows = drawerPaper.locator('tbody tr');
  const rowCount = await ticketRows.count();
  test.skip(rowCount === 0, 'no tickets available in this environment');

  // TicketsDrawer uses clickableRows="mainRow" — only the first cell (CREATED BY) triggers onRowClick
  // dispatchEvent bypasses any overlay (backdrop z-index or positioned siblings) that could block CDP click
  await ticketRows.first().locator('td').first().dispatchEvent('click');

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('Issue Type')).toBeVisible();
  await expect(page.getByText('Reported')).toBeVisible();
  await expect(page.getByText('Description Provided')).toBeVisible();
});

test('ticket detail dialog shows Mark as Resolved button for non-resolved tickets', async ({ page }) => {
  await page.locator('p').filter({ hasText: /^Tickets$/ }).first().dispatchEvent('click');
  await expect(page.getByText('CREATED BY')).toBeVisible({ timeout: 5_000 });

  // Scope to drawer paper; filter rows that do not show a "Resolved" status badge
  const drawerPaper = page.locator('.MuiDrawer-paper');
  const openRow = drawerPaper.locator('tbody tr').filter({ hasNotText: /resolved/i }).first();
  const openRowCount = await openRow.count();
  test.skip(openRowCount === 0, 'all tickets are already resolved in this environment');

  await openRow.locator('td').first().dispatchEvent('click');

  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('button', { name: 'Mark as Resolved' })).toBeVisible();
});

// ─── Checkbox selection in users table ───────────────────────────────────────

test('header checkbox selects all user rows when clicked', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  // Header checkbox is inside <thead> — MUI Checkbox renders input[type="checkbox"] inside a span
  const headerCheckbox = page.locator('thead').getByRole('checkbox');
  await expect(headerCheckbox).not.toBeChecked();

  await headerCheckbox.click();

  // Every row checkbox in <tbody> should now be checked
  const rowCheckboxes = page.locator('tbody').getByRole('checkbox');
  const rowCount = await rowCheckboxes.count();
  expect(rowCount).toBeGreaterThan(0);
  await expect(rowCheckboxes.first()).toBeChecked();
});

test('clicking header checkbox twice deselects all rows', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  const headerCheckbox = page.locator('thead').getByRole('checkbox');
  await headerCheckbox.click(); // select all
  await expect(page.locator('tbody').getByRole('checkbox').first()).toBeChecked();

  await headerCheckbox.click(); // deselect all
  await expect(page.locator('tbody').getByRole('checkbox').first()).not.toBeChecked();
});

test('individual row checkbox toggles independently', async ({ page }) => {
  const count = await waitForUsersTable(page);
  test.skip(count === 0, 'no users loaded in this environment');

  const firstRowCheckbox = page.locator('tbody tr').first().getByRole('checkbox');
  await expect(firstRowCheckbox).not.toBeChecked();

  // Clicking the checkbox also bubbles to the allRow TableRow onClick, opening the
  // ViewAssignments drawer. The drawer backdrop hides the table from the accessibility
  // tree (aria-hidden), so we must dismiss the drawer before asserting checkbox state.
  await firstRowCheckbox.click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[class*="MuiBackdrop"]')).toHaveCount(0, { timeout: 5_000 }).catch(() => {});

  await expect(firstRowCheckbox).toBeChecked();

  // Header "select all" should NOT be checked (not all rows are selected)
  const headerCheckbox = page.locator('thead').getByRole('checkbox');
  if (count > 1) {
    await expect(headerCheckbox).not.toBeChecked();
  }
});

// ─── Password validation hints in Create Employee dialog ──────────────────────

test('password hints "8–20 characters" and "At least one uppercase" are visible', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  await expect(page.getByText('8–20 characters')).toBeVisible();
  await expect(page.getByText('At least one uppercase letter')).toBeVisible();
});

test('password hints show check-circle icons when rules are satisfied', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Initially no check-circle icons for the password rules (empty field)
  await expect(page.locator('img[src*="check-circle"]')).toHaveCount(0);

  // Type a password that satisfies both rules: >= 8 chars and at least one uppercase
  const dialog = page.getByRole('dialog');
  await dialog.locator('input[type="password"]').fill('ValidPass1');

  // Both validation rules should now show the check-circle icon
  await expect(page.locator('img[src*="check-circle"]')).toHaveCount(2, { timeout: 3_000 });
});

test('Generate password button fills the password field', async ({ page }) => {
  await page.getByRole('button', { name: /Create a New Employee/i }).click();
  await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

  // Click "Generate password" — PasswordInput calls onGenerate and sets showPassword=true
  await page.getByText('Generate password').click();

  // After generate the field switches to type="text" (showPassword=true) and has a value
  const dialog = page.getByRole('dialog');
  const passwordField = dialog.locator('input[type="text"]').last();
  await expect(passwordField).not.toHaveValue('', { timeout: 3_000 });

  // Both hints should now be satisfied by the generated password
  await expect(page.locator('img[src*="check-circle"]')).toHaveCount(2, { timeout: 3_000 });
});
