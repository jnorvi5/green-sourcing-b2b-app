import time
import random
import csv
import argparse
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# --- Configuration ---
SEARCH_ROLES = ["Sustainability Director", "Marketing Manager"]
OUTPUT_FILE = "linkedin_leads.csv"
INPUT_FILE = "companies.txt"

def setup_driver():
    """Sets up the Selenium WebDriver."""
    options = webdriver.ChromeOptions()
    # options.add_argument("--headless") # Comment out for visual debugging/manual login
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--start-maximized")
    # Add some headers/arguments to be less bot-like
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    # Stealthier setup
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")

    return driver

def random_sleep(min_seconds=2, max_seconds=5):
    """Sleeps for a random amount of time."""
    time.sleep(random.uniform(min_seconds, max_seconds))

def login_linkedin(driver):
    """
     navigates to LinkedIn and waits for the user to manually log in.
    """
    print("Navigating to LinkedIn login page...")
    driver.get("https://www.linkedin.com/login")

    print("\n" + "="*50)
    print("ACTION REQUIRED: Please log in to LinkedIn in the browser window.")
    print("Once you are logged in and on the feed/home page, press ENTER in this terminal to continue.")
    print("="*50 + "\n")

    input("Press Enter to continue after login...")
    print("Proceeding with scraping...")

def search_and_extract(driver, company, role):
    """
    Searches for a specific role at a company and extracts the top result.
    """
    query = f"{company} {role}"
    print(f"Searching for: {query}")

    # URL encode the query manually or use a library, but simple replacement works for spaces
    encoded_query = query.replace(" ", "%20")
    search_url = f"https://www.linkedin.com/search/results/people/?keywords={encoded_query}&origin=GLOBAL_SEARCH_HEADER"

    driver.get(search_url)
    random_sleep(3, 6) # Wait for results to load

    results = []

    try:
        # Wait for the main results container
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, ".reusable-search__result-container"))
        )

        # Get list of results
        search_results = driver.find_elements(By.CSS_SELECTOR, ".reusable-search__result-container")

        # Limit to top 3 results per query
        for i, result in enumerate(search_results[:3]):
            try:
                # Extract Name and Link
                # The structure usually has a span with aria-hidden="true" for the name inside an anchor
                # Or we can look for the class 'app-aware-link' inside the entity title

                # Title link usually contains the name and profile URL
                title_link = result.find_element(By.CSS_SELECTOR, "a.app-aware-link")

                profile_url = title_link.get_attribute("href")
                # Remove query parameters from URL if present to clean it up
                if "?" in profile_url:
                    profile_url = profile_url.split("?")[0]

                # Name is usually inside a span inside the link
                name_span = title_link.find_element(By.CSS_SELECTOR, "span[aria-hidden='true']")
                name = name_span.text.strip()

                # Extract Job Title (Subtitle) - usually in a div with class 'entity-result__primary-subtitle'
                try:
                    title_div = result.find_element(By.CSS_SELECTOR, ".entity-result__primary-subtitle")
                    job_title = title_div.text.strip()
                except:
                    job_title = "N/A"

                print(f"  Found: {name} - {job_title}")

                results.append({
                    "Company": company,
                    "Target Role": role,
                    "Name": name,
                    "Job Title": job_title,
                    "Profile URL": profile_url
                })

            except Exception as e:
                # print(f"  Error parsing result {i}: {e}")
                continue

    except Exception as e:
        print(f"  No results found or error loading search results: {e}")

    return results

def main():
    parser = argparse.ArgumentParser(description="LinkedIn Rogue Bot")
    parser.add_argument("--input", default=INPUT_FILE, help="Path to input file with company names")
    parser.add_argument("--output", default=OUTPUT_FILE, help="Path to output CSV file")
    args = parser.parse_args()

    # Read companies
    if not os.path.exists(args.input):
        print(f"Error: Input file '{args.input}' not found.")
        return

    with open(args.input, "r") as f:
        companies = [line.strip() for line in f if line.strip()]

    print(f"Loaded {len(companies)} companies.")

    driver = setup_driver()

    try:
        login_linkedin(driver)

        all_leads = []

        for company in companies:
            print(f"\n--- Processing {company} ---")
            for role in SEARCH_ROLES:
                leads = search_and_extract(driver, company, role)
                all_leads.extend(leads)
                random_sleep(2, 4) # Pause between roles

            random_sleep(3, 7) # Longer pause between companies

        # Save to CSV
        if all_leads:
            keys = all_leads[0].keys()
            with open(args.output, "w", newline="", encoding="utf-8") as f:
                writer = csv.DictWriter(f, fieldnames=keys)
                writer.writeheader()
                writer.writerows(all_leads)
            print(f"\nSuccessfully saved {len(all_leads)} leads to {args.output}")
        else:
            print("\nNo leads found.")

    except KeyboardInterrupt:
        print("\nProcess interrupted by user.")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
    finally:
        print("Closing browser...")
        driver.quit()

if __name__ == "__main__":
    main()
