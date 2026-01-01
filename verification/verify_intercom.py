
from playwright.sync_api import sync_playwright

def verify_intercom():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Start the app server first (assume user started it or I will start it)
        # But wait, I need to start it.
        # I will rely on 'npm run build' and 'npm start' in background?
        # Or just 'npm run dev'.

        try:
            page.goto('http://localhost:3000')

            # Wait for Intercom widget frame
            # Intercom injects an iframe with id 'intercom-frame' or class.
            # Usually it appends a div #intercom-container

            # We might need to wait a bit as it loads async
            page.wait_for_timeout(5000)

            # Check if Intercom script is injected
            # We can check for window.Intercom
            is_intercom_present = page.evaluate("typeof window.Intercom === 'function'")
            print(f'Intercom present: {is_intercom_present}')

            # Screenshot
            page.screenshot(path='verification/intercom_verification.png')

        except Exception as e:
            print(f'Error: {e}')
        finally:
            browser.close()

if __name__ == '__main__':
    verify_intercom()
