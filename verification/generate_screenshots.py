import asyncio
from playwright.async_api import async_playwright
import os

# Ensure output directory exists
os.makedirs("verification/screenshots", exist_ok=True)

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        context = await browser.new_context(viewport={"width": 1280, "height": 800})
        page = await context.new_page()

        print("1. Login Page")
        await page.goto("http://localhost:3001/login")
        await page.wait_for_selector("text=Welcome Back")
        await page.screenshot(path="verification/screenshots/01_login.png")
        print("   -> Captured 01_login.png")

        print("2. Enable Test Mode & Dashboard")
        # Inject Test Token
        await page.evaluate("""() => {
            localStorage.setItem("auth-token", "test_token");
            localStorage.setItem("user-type", "architect");
        }""")

        await page.goto("http://localhost:3001/architect/dashboard")
        await page.wait_for_selector("text=My Projects")
        await page.screenshot(path="verification/screenshots/02_dashboard.png")
        print("   -> Captured 02_dashboard.png")

        print("3. Projects List")
        await page.click("text=My Projects")
        await page.wait_for_url("**/projects")
        await page.wait_for_selector("text=Green Office Tower")
        await page.screenshot(path="verification/screenshots/03_projects_list.png")
        print("   -> Captured 03_projects_list.png")

        print("4. Create Project Modal")
        await page.click("text=+ New Project")
        await page.wait_for_url("**/projects/new")
        # Check for form fields
        await page.wait_for_selector("input")
        await page.screenshot(path="verification/screenshots/04_create_project.png")
        print("   -> Captured 04_create_project.png")

        # Go back to list
        await page.goto("http://localhost:3001/projects")
        await page.wait_for_selector("text=Green Office Tower")

        print("5. Project Detail")
        await page.click("text=Green Office Tower")
        # Matches /projects/proj-1 because that's the ID in the mock data in ProjectsPage
        await page.wait_for_url("**/projects/proj-1")
        await page.wait_for_selector("text=Mass Timber Panels")
        await page.screenshot(path="verification/screenshots/05_project_detail.png")
        print("   -> Captured 05_project_detail.png")

        print("6. Create RFQ")
        # The mock data in ProjectDetailPage has "Mass Timber Panels" as "planned".
        # The button "Create RFQ ->" should be visible.
        row = page.locator("tr", has_text="Mass Timber Panels")
        await row.locator("text=Create RFQ").click()

        await page.wait_for_url("**/architect/rfq/new?*")
        await page.wait_for_selector("text=Request a Quote", timeout=10000)

        await page.screenshot(path="verification/screenshots/06_create_rfq.png")
        print("   -> Captured 06_create_rfq.png")

        print("Done.")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
