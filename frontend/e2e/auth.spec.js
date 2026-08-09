import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  
  test('User can login successfully', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Check if we are on the login page by looking for the heading
    await expect(page.locator('h1', { hasText: /Welcome Back/i }).first()).toBeVisible();

    // Fill in the login form (Assuming standard test credentials)
    // Note: In a real CI environment, these should come from env variables or a test DB seed
    await page.fill('input[type="email"]', 'test@test.com');
    await page.fill('input[type="password"]', 'test');

    // Intercept the API call to mock a successful login if the backend isn't running
    // Or let it hit the real backend if E2E is full stack. We'll assume full stack for E2E.
    // If the backend isn't seeded with this user, this test will fail, which is correct for E2E.

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // Check if Dashboard elements are visible indicating successful login
    await expect(page.locator('text=Overview').first()).toBeVisible();
  });

  test('Shows error on invalid login', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="email"]', 'wrong@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    await page.click('button[type="submit"]');

    // Wait for the error toast or message
    // Assuming you have a toast notification system with a generic error class
    const errorMsg = page.locator('text=Invalid email or password');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

});
