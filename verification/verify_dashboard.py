
import os
import sys
from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a desktop viewport
        context = browser.new_context(viewport={"width": 1280, "height": 800})

        # We need to route network requests to mock Supabase responses
        # since we don't have a real backend running in this environment context easily reachable
        # and we don't have auth credentials.

        # However, testing with a running dev server is best.
        # But I need to start the dev server first.
        # Assuming the dev server will be at localhost:3001

        page = context.new_page()

        # Mock Supabase Auth getUser
        # We intercept the request to supabase auth and return a fake user
        # Note: Actual Supabase client runs in browser, making requests to supabase.co
        # We need to intercept those.
        # But for 'app/supplier/dashboard/page.tsx', it uses createClient from @/lib/supabase/client
        # which makes network requests.

        # Intercept auth user request
        page.route("**/auth/v1/user", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": "test-user-id", "email": "supplier@example.com", "role": "authenticated"}'
        ))

        # Intercept profile request (from 'suppliers' table)
        page.route("**/rest/v1/suppliers*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='{"id": "test-supplier-id", "user_id": "test-user-id", "company_name": "Test Supplier Co", "description": "Best sustainable materials", "certifications": [{"type": "ISO 14001"}], "scraped_data": []}'
        ))

        # Intercept products request
        page.route("**/rest/v1/products*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id": "prod-1", "name": "Eco Concrete", "material_type": "Concrete", "supplier_id": "test-supplier-id", "verified": true}]'
        ))

        # Intercept rfqs request
        page.route("**/rest/v1/rfqs*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[{"id": "rfq-1", "project_name": "Green Tower", "project_details": {"material_type": "Concrete"}, "delivery_deadline": "2025-12-31T00:00:00Z", "created_at": "2025-10-01T00:00:00Z", "users": {"full_name": "Alice Arch", "company_name": "Arch Firm"}}]'
        ))

        # Intercept rfq_responses request
        page.route("**/rest/v1/rfq_responses*", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body='[]'
        ))

        try:
            # Navigate to the dashboard
            page.goto("http://localhost:3001/supplier/dashboard", timeout=60000)

            # Wait for content to load
            page.wait_for_selector("text=Supplier Dashboard", timeout=30000)

            # Check for key elements
            if page.is_visible("text=Test Supplier Co"):
                print("Found Company Name")

            if page.is_visible("text=Eco Concrete"):
                print("Found Product")

            if page.is_visible("text=Green Tower"):
                print("Found RFQ")

            # Take screenshot
            page.screenshot(path="verification/supplier_dashboard.png", full_page=True)
            print("Screenshot saved to verification/supplier_dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
            # Take error screenshot
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
