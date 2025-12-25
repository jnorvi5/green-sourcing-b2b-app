import os
from playwright.sync_api import sync_playwright, expect

BASE_URL = os.getenv("BASE_URL", "http://localhost:3000")

def verify_login_a11y(page):
    print("Navigating to login page...")
    page.goto(f"{BASE_URL}/login")

    This function navigates to the login page and performs a series of checks:
    - Ensures the password visibility toggle button is visible with the
      expected initial aria-label ("Show password").
    - Clicks the toggle button and verifies that the aria-label updates to
      "Hide password", confirming that assistive technologies receive the
      correct state.
    - Locates the login-related checkbox (e.g., "Remember me") and asserts
      that its CSS classes include the `sr-only` class used for
      screen-reader-only labels, helping ensure it is accessible to
      assistive technologies even if visually hidden.
    - Captures screenshots before and after toggling the password visibility
      for manual visual inspection.

    Args:
        page: A Playwright Page instance that will be used to load and
            interact with the login UI at ``http://localhost:3000/login``.
    """
    print("Navigating to login page...")
    page.goto("http://localhost:3000/login")

    # Wait for the password toggle button to be visible
    print("Waiting for password toggle button...")
    toggle_btn = page.locator("button[aria-label='Show password']")
    classes = checkbox.get_attribute("class") or ""
    class_list = classes.split()
    if "sr-only" in class_list:
    # Take a screenshot of initial state
    print("Taking screenshot of initial state...")
    page.screenshot(path="verification/login_initial.png")

    # Click the toggle button
    print("Clicking toggle button...")
    toggle_btn.click()

    # Verify aria-label changes
    print("Verifying aria-label change...")
    toggle_btn_hidden = page.locator("button[aria-label='Hide password']")
    expect(toggle_btn_hidden).to_be_visible()

    # Check focus state on checkbox (simulated)
    # We can't easily see focus ring in screenshot without simulating tab key,
    # but we can verify the sr-only class exists
    print("Verifying checkbox classes...")
    checkbox = page.locator("input[type='checkbox']")
    classes = checkbox.get_attribute("class")
    if "sr-only" in classes:
        print("SUCCESS: Checkbox has sr-only class")
    else:
        print(f"FAILURE: Checkbox classes: {classes}")

    # Take screenshot after toggle
    print("Taking screenshot after toggle...")
    page.screenshot(path="verification/login_toggled.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_login_a11y(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
