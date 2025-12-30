import { test, expect } from '@playwright/test';

test.describe('General User Flow', () => {
  test('homepage has call to actions', async ({ page }) => {
    await page.goto('/');
    // Check for "Join Founding 50"
    await expect(page.getByText('Join Founding 50')).toBeVisible();
    await expect(page.getByText('Founding 50 Program')).toBeVisible();
  });

  // test('architect pitch page loads', async ({ page }) => {
  //   // Expecting 200 OK. If 404, this should fail.
  //   const response = await page.goto('/architects');
  //   expect(response?.status()).toBe(200);
  // });
});
