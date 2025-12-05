import { test, expect } from '@playwright/test';

test.describe('Authentication Flows', () => {
  test('should load the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveTitle(/GreenChainz/i);
    // Check for login form elements
    // The current login page is a simple "Access Code" gate, not a full email/password login yet.
    // Based on reading app/login/page.tsx
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByText('Access Code')).toBeVisible();
  });

  // Note: Actual signup/login tests require a running Supabase instance or mocked auth.
  // For this environment, we will verify the UI elements presence.
  // The current login page does not have a signup link yet.
});
