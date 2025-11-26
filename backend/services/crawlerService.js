const https = require('https');
const http = require('http');

class CrawlerService {
  constructor() {
    this.visited = new Set();
    this.errors = [];
  }

  /**
   * Crawls a URL to map internal links and report 404s.
   * @param {string} startUrl 
   */
  async crawl(startUrl) {
    console.log(`[Site Crawler] Starting crawl of ${startUrl}...`);
    this.visited.clear();
    this.errors = [];
    
    await this.visit(startUrl, startUrl);
    
    return {
      visitedCount: this.visited.size,
      errors: this.errors
    };
  }

  async visit(url, baseUrl) {
    if (this.visited.has(url)) return;
    this.visited.add(url);

    try {
      const { html, status } = await this.fetchUrl(url);

      if (status === 404) {
        console.error(`[Site Crawler] ❌ 404 Error found: ${url}`);
        this.errors.push({ url, status });
        return;
      }

      if (status >= 400) {
        console.error(`[Site Crawler] ⚠️ Error ${status} found: ${url}`);
        this.errors.push({ url, status });
        return;
      }

      // Simple regex to find links (href="...")
      const linkRegex = /href=["']((?:\/|https?:\/\/)[^"']+)["']/g;
      let match;
      while ((match = linkRegex.exec(html)) !== null) {
        let nextUrl = match[1];

        // Handle relative URLs
        if (nextUrl.startsWith('/')) {
          nextUrl = new URL(nextUrl, baseUrl).toString();
        }

        // Only crawl internal links
        if (nextUrl.startsWith(baseUrl)) {
          await this.visit(nextUrl, baseUrl);
        }
      }

    } catch (error) {
      console.error(`[Site Crawler] Failed to fetch ${url}: ${error.message}`);
      this.errors.push({ url, error: error.message });
    }
  }

  fetchUrl(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      client.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ html: data, status: res.statusCode }));
      }).on('error', (err) => reject(err));
    });
  }
}

module.exports = new CrawlerService();
