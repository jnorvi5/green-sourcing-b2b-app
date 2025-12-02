---
inclusion: fileMatch
fileMatchPattern:
  [
    "backend/providers/**/*.js",
    "backend/services/crawler*.js",
    "backend/services/dataScout*.js",
  ]
---

# Automated Scraper & Data Provider Integration

This guide covers patterns for building scrapers and data provider integrations in GreenChainz.

## Architecture Pattern

All data providers follow the **BaseProvider** abstract class pattern:

1. **fetch()** - Retrieve raw data from external API or web source
2. **transform()** - Convert to GreenChainz internal schema
3. **validate()** - Check data integrity and completeness
4. **sync()** - Orchestrate the full pipeline (fetch → transform → validate → insert)

## Provider Priority System

Providers have priority levels for conflict resolution when multiple sources return the same EPD:

- **Priority 1** (Highest): EPD International - Most authoritative source
- **Priority 2**: EC3 (Building Transparency) - Verified but broader dataset
- **Priority 3+**: Other providers (ECO Platform, FSC, etc.)

When deduplicating by `epd_number`, keep the record from the highest priority provider.

## API Integration Best Practices

### Authentication

- Store API keys in environment variables: `EPD_INTERNATIONAL_API_KEY`, `EC3_API_KEY`, etc.
- Always check if API key exists before attempting authenticated requests
- Implement graceful fallback to public endpoints or mock data when API unavailable

### Rate Limiting

- Respect provider rate limits (e.g., EC3: 100 requests/minute free tier)
- Implement exponential backoff for failed requests
- Use caching (Redis) to minimize redundant API calls

### Error Handling

```javascript
try {
  if (this.apiKey) {
    return await this.searchWithAPI(query);
  }
  return await this.searchPublic(query);
} catch (error) {
  console.error(`[${this.name}] Search error:`, error.message);
  return this.getMockData(query); // Always have fallback
}
```

## Data Transformation Standards

All providers must transform to this standard schema:

```javascript
{
  product_name: string,
  manufacturer: string,
  epd_number: string,           // Unique identifier
  gwp_fossil_a1_a3: number,     // kg CO2e per declared unit
  recycled_content_pct: number,
  certifications: string[],
  validity_start: string,       // ISO date
  validity_end: string,         // ISO date
  verified_by: string,          // Provider name
  data_source_url: string,      // Link to original EPD
  confidence_score: number,     // 0.0 - 1.0
  raw_data: object              // Original response (optional)
}
```

## Mock Data Strategy

Every provider MUST implement `getMockData(query)` for:

- Development without API keys
- Fallback when external APIs are down
- Testing and demos

Mock data should:

- Use keyword matching for realistic search behavior
- Cover major material categories (steel, concrete, insulation, wood, etc.)
- Include realistic GWP values and recycled content percentages
- Maintain consistency with real API response structure

## Web Scraping Guidelines

When scraping public websites (not APIs):

### Respect robots.txt

Check the site's robots.txt before scraping

### User-Agent Headers

Always identify your scraper:

```javascript
headers: {
  'User-Agent': 'GreenChainz-Verifier/1.0',
  'Accept': 'application/json'
}
```

### Parsing HTML

- Use regex sparingly - prefer HTML parsers for complex extraction
- Handle missing fields gracefully with fallbacks
- Validate extracted data before transformation

### Crawler Service Pattern

For site mapping and link checking (see `crawlerService.js`):

```javascript
- Track visited URLs to avoid infinite loops
- Report 404s and other HTTP errors
- Only crawl internal links (same domain)
- Use simple regex for href extraction: /href=["']((?:\/|https?:\/\/)[^"']+)["']/g
```

## Validation Rules

### Required Fields

- `product_name`, `manufacturer`, `epd_number` are mandatory
- `gwp_fossil_a1_a3` should be present for carbon calculations
- `validity_end` is critical for expiration checks

### Data Quality Checks

```javascript
validateRecord(record) {
  const errors = [];
  const now = new Date();
  const validEnd = new Date(record.validity_end);

  if (now > validEnd) {
    errors.push("EPD has expired");
  }

  if (record.gwp_fossil_a1_a3 == null) {
    errors.push("Missing GWP data");
  }

  return { isValid: errors.length === 0, errors };
}
```

## Deduplication Strategy

The **DataScoutService** aggregates results from multiple providers:

1. Search all providers in parallel using `Promise.all()`
2. Flatten results into single array
3. Attach `_providerPriority` metadata to each record
4. Sort by priority (ascending: 1, 2, 3...)
5. Deduplicate by `epd_number`, keeping first occurrence (highest priority)
6. Remove internal metadata before returning

## Testing Scrapers

Test scripts location: `backend/scripts/test-*.js`

```bash
node backend/scripts/test-data-scout.js    # Test aggregation
node backend/scripts/test-crawler.js       # Test site crawler
```

Test checklist:

- API authentication (with and without keys)
- Public endpoint fallback
- Mock data fallback
- Data transformation accuracy
- Validation logic
- Error handling for network failures

## Common Pitfalls

- **Don't** make synchronous HTTP requests - always use async/await
- **Don't** hardcode API keys - use environment variables
- **Don't** fail silently - log errors but return empty arrays to keep other providers working
- **Don't** trust external data - always validate before database insertion
- **Do** implement timeouts for HTTP requests
- **Do** cache frequently accessed data in Redis
- **Do** version your transformations (API schemas change)

## Provider-Specific Notes

### EPD International

- Most authoritative source for EPDs
- Public search available at environdec.com/library
- Full API requires partnership agreement
- Registration numbers format: `S-P-XXXXX`

### EC3 (Building Transparency)

- Free API with registration
- OpenXPD UUID format for identifiers
- Rich filtering: category, country, recycled content
- Rate limit: 100 req/min (free tier)

### FSC (Forest Stewardship Council)

- Certificate verification API
- Chain of Custody tracking
- License codes format: `FSC-C######`

## File Locations

- **Providers**: `backend/providers/*.js`
- **Base class**: `backend/providers/baseProvider.js`
- **Aggregation**: `backend/services/dataScoutService.js`
- **Site crawler**: `backend/services/crawlerService.js`
- **Test scripts**: `backend/scripts/test-*.js`
