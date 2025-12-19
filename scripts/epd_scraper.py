import requests
from bs4 import BeautifulSoup
import time
import random
import json
import re
import argparse
import sys
import os
from datetime import datetime, timezone
from pymongo import MongoClient

BASE_URL = "https://www.environdec.com/library"

def get_soup(url):
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        return BeautifulSoup(response.content, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None

def scrape_page(soup):
    results = []

    # The class names seem to be generated CSS modules, so we use regex partial matching
    # Based on observation:
    # Container: EPDLibraryResultItem-module__Ik26PG__container
    # Title: EPDLibraryResultItem-module__Ik26PG__title
    # Reg Number: EPDLibraryResultItem-module__Ik26PG__fullIdentificationNumber
    # Download: EPDLibraryResultItem-module__Ik26PG__downloadLink
    # Tags: SearchTag-module__2tpr8G__tag

    items = soup.find_all("div", class_=re.compile(r"EPDLibraryResultItem-module.*container"))

    for item in items:
        try:
            # Extract Product Name
            title_tag = item.find("a", class_=re.compile(r"EPDLibraryResultItem-module.*title"))
            product_name = title_tag.get_text(strip=True) if title_tag else "Unknown"

            # Extract Registration Number
            reg_tag = item.find("div", class_=re.compile(r"EPDLibraryResultItem-module.*fullIdentificationNumber"))
            reg_number = reg_tag.get_text(strip=True) if reg_tag else "Unknown"

            # Extract PDF Download URL
            download_tag = item.find("a", class_=re.compile(r"EPDLibraryResultItem-module.*downloadLink"))
            pdf_url = download_tag['href'] if download_tag and download_tag.has_attr('href') else None

            # Extract Manufacturer
            # The manufacturer is usually the second tag in the footer
            # Footer structure:
            # <div class="...tags">
            #   <div class="...tag">Category</div>
            #   <div class="...tag">Manufacturer</div>
            #   <div class="...tag">Location</div>
            #   <div class="...tag">Type</div>
            # </div>
            manufacturer = "Unknown"
            footer_tags = item.find_all("div", class_=re.compile(r"SearchTag-module.*tag"))

            # Heuristic: Manufacturer is usually the 2nd item (index 1)
            # But sometimes fields might be missing.
            # Usually: Category, Manufacturer, Location, Type.
            # We can try to guess based on content if needed, but index 1 is a good start.
            if len(footer_tags) >= 2:
                manufacturer = footer_tags[1].get_text(strip=True)
            elif len(footer_tags) > 0:
                # Fallback: just take the first one if only one exists? Or maybe it's the category.
                # Let's keep it as Unknown if unsure to avoid bad data.
                pass

            results.append({
                "manufacturer_name": manufacturer,
                "product_name": product_name,
                "registration_number": reg_number,
                "pdf_download_url": pdf_url
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

    # MongoDB connection
    mongo_conn_str = os.getenv("MONGO_CONNECTION_STRING", "YOUR_MONGO_CONNECTION_STRING")
    client = MongoClient(mongo_conn_str)
    db = client.greenchainz_raw_lake

    page = args.start_page
    total_items = 0

    print(f"Starting scraper at {BASE_URL}")
    print(f"Targeting MongoDB")

    while True:
        if args.limit and (page - args.start_page + 1) > args.limit:
            print(f"Reached page limit of {args.limit}")
            break

        url = f"{BASE_URL}?page={page}"
        print(f"Scraping page {page}...")

        soup = get_soup(url)
        if not soup:
            break

        page_data = scrape_page(soup)
        if not page_data:
            print("No data found on this page. Stopping.")
            break

        # Insert into MongoDB
        for item in page_data:
            doc = {
                "source": "epd_intl",
                "data": item,
                "timestamp": datetime.now(timezone.utc)
            }
            try:
                db.raw_products.insert_one(doc)
            except Exception as e:
                 print(f"Error inserting document: {e}")

        count = len(page_data)
        total_items += count
        print(f"Inserted {count} items from page {page}")

        # Random delay
        sleep_time = random.uniform(2, 5)
        print(f"Sleeping for {sleep_time:.2f} seconds...")
        time.sleep(sleep_time)

        page += 1

    print(f"Scraping complete. Total items inserted: {total_items}")

if __name__ == "__main__":
    main()
