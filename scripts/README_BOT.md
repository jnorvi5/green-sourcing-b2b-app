# LinkedIn Rogue Bot

This Python script scrapes LinkedIn to find specific roles (Sustainability Director, Marketing Manager) for a list of companies. It is designed for local use.

## Prerequisites

1.  **Python 3.x** installed.
2.  **Google Chrome** browser installed.

## Setup

1.  Navigate to the `scripts` directory:
    ```bash
    cd scripts
    ```

2.  Install the required Python packages:
    ```bash
    pip install -r requirements_bot.txt
    ```

## Usage

1.  **Prepare your input list:**
    Edit the `companies.txt` file in the `scripts/` directory. Add one company name per line.
    Example:
    ```text
    Apple
    Patagonia
    Tesla
    ```

2.  **Run the script:**
    ```bash
    python linkedin_rogue_bot.py
    ```

3.  **Login:**
    - The script will open a Chrome browser window and navigate to the LinkedIn login page.
    - **Manually log in** to your LinkedIn account in that window.
    - Once logged in and you see your feed, go back to your terminal and **press Enter**.

4.  **Let it run:**
    - The bot will search for "[Company] Sustainability Director" and "[Company] Marketing Manager".
    - It extracts the Name, Job Title, and Profile URL of the top results.
    - It saves the data to `linkedin_leads.csv`.

## Output

The script generates a `linkedin_leads.csv` file with the following columns:
-   Company
-   Target Role
-   Name
-   Job Title
-   Profile URL

## Notes

-   **Safety:** The script uses random delays to mimic human behavior and avoid rate limits. However, excessive scraping can still lead to LinkedIn temporary bans or warnings. Use with caution.
-   **Selectors:** LinkedIn frequently changes their HTML structure. If the script stops finding names (e.g., "No results found"), the CSS selectors in the code (`search_and_extract` function) may need to be updated.
