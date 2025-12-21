import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re
import argparse
import sys

BASE_URL = "https://www.environdec.com/library"
OUTPUT_FILE = "epd_raw_data.json"

def get_soup(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)

        # If 404 or other error, return None but let caller handle it
        if response.status_code != 200:
            print(f"Status code {response.status_code} for {url}")
            return None, response.text

        return BeautifulSoup(response.content, "html.parser"), response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None, None

def scrape_page(soup, raw_html, page_url):
    results = []

    # The class names seem to be generated CSS modules, so we use regex partial matching
    items = soup.find_all("div", class_=re.compile(r"EPDLibraryResultItem-module.*container"))

    if not items:
        # Fallback: Dump raw HTML if structure unknown or empty
        print(f"⚠️ No items found on {page_url}. Dumping raw HTML not supported without DB.")
        return []

    for item in items:
        try:
            # Extract Product Name
            title_tag = item.find("a", class_=re.compile(r"EPDLibraryResultItem-module.*title"))
            product_name = title_tag.get_text(strip=True) if title_tag else "Unknown"

            # Extract Detail Page URL (Unique ID)
            detail_url = "https://www.environdec.com" + title_tag['href'] if title_tag and title_tag.has_attr('href') else None

            # Extract Registration Number
            reg_tag = item.find("div", class_=re.compile(r"EPDLibraryResultItem-module.*fullIdentificationNumber"))
            reg_number = reg_tag.get_text(strip=True) if reg_tag else "Unknown"

            # Extract PDF Download URL
            download_tag = item.find("a", class_=re.compile(r"EPDLibraryResultItem-module.*downloadLink"))
            pdf_url = download_tag['href'] if download_tag and download_tag.has_attr('href') else None

            # Extract Manufacturer
            manufacturer = "Unknown"
            footer_tags = item.find_all("div", class_=re.compile(r"SearchTag-module.*tag"))
            if len(footer_tags) >= 2:
                manufacturer = footer_tags[1].get_text(strip=True)

            results.append({
                "manufacturer_name": manufacturer,
                "product_name": product_name,
                "registration_number": reg_number,
                "pdf_download_url": pdf_url,
                "source_page": page_url
            })

        except Exception as e:
            print(f"Error parsing item: {e}")
            continue

    return results

def main():
    parser = argparse.ArgumentParser(description="Scrape EPD data from environdec.com")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of pages to scrape")
    parser.add_argument("--start-page", type=int, default=1, help="Start page number")
    args = parser.parse_args()

    all_data = []
    page = args.start_page

    print(f"Starting scraper at {BASE_URL}")

    while True:
        if args.limit and (page - args.start_page + 1) > args.limit:
            print(f"Reached page limit of {args.limit}")
            break

        url = f"{BASE_URL}?page={page}"
        print(f"Scraping page {page}...")

        soup, raw_html = get_soup(url)
        if not soup:
            break

        page_data = scrape_page(soup, raw_html, url)

        if not page_data:
            print("No parsed items found on this page. Stopping.")
            break
        else:
            print(f"Found {len(page_data)} items on page {page}")
            all_data.extend(page_data)

        # Random delay
        sleep_time = random.uniform(1.0, 3.0)
        print(f"Sleeping for {sleep_time:.2f} seconds...")
        time.sleep(sleep_time)

        page += 1

    print(f"Scraping complete. Total items: {len(all_data)}")

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)

    print(f"Data saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
