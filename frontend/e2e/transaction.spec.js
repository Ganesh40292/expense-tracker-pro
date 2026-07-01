import { test, expect } from '@playwright/test';

test.describe('Transaction Management', () => {

  // Run before each test in this block to ensure user is logged in
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/');
  });

  test('User can add a new transaction', async ({ page }) => {
    // Navigate to transactions page
    await page.click('text=Transactions');
    await expect(page).toHaveURL('/transactions');

    // Click "Add Transaction" button
    await page.click('button:has-text("Add Transaction")');

    // Wait for modal to appear
    const modal = page.locator('.modal-content');
    await expect(modal).toBeVisible();

    // Fill out the transaction form
    await page.fill('input[name="title"]', 'E2E Test Coffee');
    await page.fill('input[name="amount"]', '4.50');
    await page.selectOption('select[name="type"]', 'EXPENSE');
    await page.selectOption('select[name="category"]', 'Food');
    
    // Select payment method from the secondary select (assuming it's rendered)
    // If not, we just fill description
    await page.fill('input[name="description"]', 'Morning coffee run');

    // Submit the form
    await page.click('button:has-text("Add Transaction")');

    // Wait for modal to close
    await expect(modal).not.toBeVisible();

    // Verify the new transaction appears in the table
    // Look for a cell containing "E2E Test Coffee"
    const newTxnRow = page.locator('td', { hasText: 'E2E Test Coffee' }).first();
    await expect(newTxnRow).toBeVisible();
  });

});
