# Major Changes Proposal

This document outlines recommended changes that are significant in scope or require your decision.

## 1. Security & Risk Management

### 🔴 Public Test API (`pages/api/test-email.ts`)
- **Issue**: This endpoint is public and triggers AI generation/emails, which costs money.
- **Recommendation**: Delete this file or add authentication middleware.

### 🟠 "Rogue" LinkedIn Bot (`scripts/linkedin_rogue_bot.py`)
- **Issue**: Uses Selenium with a personal account, which risks LinkedIn account bans.
- **Recommendation**: Use an official API (e.g., Proxycurl) or deprecated this script.

## 2. Dependency Optimization

### 📉 Browser Automation Bloat
- **Issue**: The project currently relies on **three** different browser automation tools:
  1. `Playwright` (for tests)
  2. `Puppeteer` & `Puppeteer-Core` (for `lib/agents`)
  3. `Selenium` (for `linkedin_rogue_bot.py`)
- **Recommendation**: Standardize on **Playwright**. It is already set up for tests, is faster, and avoids managing multiple binaries.
  - Rewrite `lib/agents/scraper/browser-pool.ts` to use Playwright.
  - Remove `puppeteer` and `selenium` dependencies.

### 🗑️ Redundant Dependencies
- **Issue**: `puppeteer` (full) and `puppeteer-core` are both listed. `puppeteer-core` is likely sufficient if you manage the binary, or `puppeteer` if you want it downloaded. Having both is redundant.

## 3. Project Structure

### 📁 Landing Page Duplication
- **Issue**: `cloudflare-landing/` contains static HTML pages that seem to be an early MVP. `app/` contains the Next.js application.
- **Recommendation**: If the Next.js app (`app/`) is now the source of truth, `cloudflare-landing/` should be archived or deleted to avoid confusion.

## 4. Next Steps
- [ ] Approve deletion of `pages/api/test-email.ts`
- [ ] Approve migration to Playwright for all scraping
- [ ] Approve deletion of `cloudflare-landing/`
