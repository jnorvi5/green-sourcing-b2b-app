// backend/providers/ecoPlatform.js
// Mock provider for ECO Platform

class ECOPlatformProvider {
  constructor() {
    this.name = 'ECO Platform';
    this.priority = 3; // Lowest priority
  }

  /**
   * Search for EPDs
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of EPD objects
   */
  async search(query) {
    console.log(`[${this.name}] Searching for: ${query}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 700));

    // Return mock data based on query
    if (query.toLowerCase().includes('wood') || query.toLowerCase().includes('timber')) {
      return [{
        product_name: "Cross Laminated Timber (CLT)",
        manufacturer: "Nordic Structures",
        epd_number: "ECO-55555",
        gwp_fossil_a1_a3: -150.0, // Carbon negative due to sequestration (often reported differently, but for mock purposes)
        recycled_content_pct: 0.0,
        certifications: ["PEFC", "FSC"],
        validity_start: "2022-05-20",
        validity_end: "2027-05-20",
        verified_by: "Institut Bauen und Umwelt e.V.",
        data_source_url: "https://www.eco-platform.org/epd/55555",
        confidence_score: 0.92
      }];
    }

    return [];
  }
}

module.exports = ECOPlatformProvider;
