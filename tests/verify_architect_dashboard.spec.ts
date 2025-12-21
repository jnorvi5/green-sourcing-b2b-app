import { test, expect } from '@playwright/test';

test.describe('Architect Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('/architect/dashboard');

    // Simulate Test Mode Login
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test_token_123');
      localStorage.setItem('user-type', 'architect');
    });

    // Reload to apply local storage changes
    await page.reload();
  });

  test('should load dashboard and display mock products', async ({ page }) => {
    // Verify Header
    await expect(page.locator('h1')).toContainText('Architect Dashboard');

    // Verify Search Section exists
    await expect(page.getByPlaceholder('e.g. Insulation, Concrete, Flooring...')).toBeVisible();

    // Verify Mock Products Load (Eco-Friendly Insulation Batts is in MOCK_PRODUCTS)
    await expect(page.getByText('Eco-Friendly Insulation Batts')).toBeVisible();
  });

  test('should allow searching for products', async ({ page }) => {
    const searchInput = page.getByPlaceholder('e.g. Insulation, Concrete, Flooring...');
    await searchInput.fill('Concrete');

    const searchButton = page.getByRole('button', { name: /Find Materials/i }); // Matches "Searching..." or "Find Materials"
    await searchButton.click();

    // Should find "Low-Carbon Concrete Block"
    await expect(page.getByText('Low-Carbon Concrete Block')).toBeVisible();

    // Should NOT find "Reclaimed Oak Flooring" (mock data filtering)
    await expect(page.getByText('Reclaimed Oak Flooring')).toBeHidden();
  });

  test('should allow comparing products and requesting quote', async ({ page }) => {
    // 1. Select two products to compare
    // We need to target the checkbox labels or the specific inputs.
    // The label text is "Compare". There are multiple.

    // Get the first two compare checkboxes
    const compareButtons = page.getByText('Compare');
    await compareButtons.nth(0).click();
    await compareButtons.nth(1).click();

    // 2. Verify "Compare Now" floating button appears
    const compareNowBtn = page.getByRole('button', { name: 'Compare Now' });
    await expect(compareNowBtn).toBeVisible();
    await expect(page.getByText('2 Selected')).toBeVisible();

    // 3. Open Comparison Modal
    await compareNowBtn.click();

    // Verify Modal is open
    const modal = page.locator('.fixed.inset-0').last(); // Get the last overlay (in case of multiples, though unlikely)
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Product Comparison')).toBeVisible();

    // 4. Click "Select & Request Quote" for one product inside the modal
    // Note: The previous failure was ambiguous "Request Quote".
    // The button in the modal is "Select & Request Quote".
    const selectBtn = modal.getByRole('button', { name: 'Select & Request Quote' }).first();
    await selectBtn.click();

    // 5. Verify RFQ Modal Opens
    // The RFQ modal has title "Request Quote"
    const rfqModal = page.locator('.fixed.inset-0').last();
    await expect(rfqModal.getByText('Request Quote', { exact: true })).toBeVisible(); // Header

    // 6. Fill RFQ
    await rfqModal.getByPlaceholder('e.g. 500 sq ft').fill('1000 sq ft');
    await rfqModal.getByRole('button', { name: 'Send Request' }).click();

    // 7. Verify Success
    await expect(page.getByText('Request sent successfully!')).toBeVisible();
  });
});
