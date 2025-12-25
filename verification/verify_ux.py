from playwright.sync_api import sync_playwright, expect

def verify_login_a11y(page):
    print("Navigating to login page...")
    page.goto("http://localhost:3000/login")

    # Wait for the password toggle button to be visible
    print("Waiting for password toggle button...")
    toggle_btn = page.locator("button[aria-label='Show password']")
    expect(toggle_btn).to_be_visible()

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
