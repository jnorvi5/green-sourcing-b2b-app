from playwright.sync_api import sync_playwright

def verify_site_structure(page):
    # 1. Verify Homepage
    print("Navigating to Homepage...")
    page.goto("http://localhost:3001")
    page.screenshot(path="verification/homepage.png")
    print("Homepage screenshot taken.")

    # 2. Verify Founding 50 Page
    print("Navigating to Founding 50...")
    page.goto("http://localhost:3001/founding-50")
    page.screenshot(path="verification/founding-50.png")
    print("Founding 50 screenshot taken.")

    # 3. Verify How It Works Page
    print("Navigating to How It Works...")
    page.goto("http://localhost:3001/how-it-works")
    page.screenshot(path="verification/how-it-works.png")
    print("How It Works screenshot taken.")

    # 4. Verify Header Navigation
    print("Verifying Header Navigation...")
    page.goto("http://localhost:3001")

    # Click Founding 50 link in header
    page.locator("nav").get_by_text("Founding 50").click()
    page.wait_for_url("http://localhost:3001/founding-50")
    print("Navigation to Founding 50 verified.")

    page.goto("http://localhost:3001")
    # Click How It Works link in header (ensure we get the one in nav)
    page.locator("nav").get_by_text("How It Works").click()
    page.wait_for_url("http://localhost:3001/how-it-works")
    print("Navigation to How It Works verified.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_site_structure(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
