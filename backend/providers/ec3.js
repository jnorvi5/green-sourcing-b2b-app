// backend/providers/ec3.js
// Mock provider for Building Transparency EC3

class EC3Provider {
  constructor() {
    this.name = 'EC3 (Building Transparency)';
    this.priority = 2; // Medium priority
  }

  /**
   * Search for EPDs
   * @param {string} query - Search query
   * @returns {Promise<Array>} - List of EPD objects
   */
  async search(query) {
    console.log(`[${this.name}] Searching for: ${query}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600));

    // Return mock data based on query
    if (query.toLowerCase().includes('concrete') || query.toLowerCase().includes('cement')) {
      return [{
        product_name: "Low Carbon Concrete Mix",
        manufacturer: "GreenCrete Solutions",
        epd_number: "EC3-09876",
        gwp_fossil_a1_a3: 240.5,
        recycled_content_pct: 15.0,
        certifications: ["NRMCA Verified"],
        validity_start: "2023-11-10",
        validity_end: "2028-11-10",
        verified_by: "ASTM International",
        data_source_url: "https://buildingtransparency.org/ec3/epds/09876",
        confidence_score: 0.90
      }];
    }

    // Overlap with EPD International for "steel" to test aggregation logic
    if (query.toLowerCase().includes('steel')) {
      return [{
        product_name: "Recycled Steel Rebar Generic",
        manufacturer: "SteelCorp Industries",
        epd_number: "S-P-00123", // Same ID as EPD International
        gwp_fossil_a1_a3: 455.0, // Slightly different value
        recycled_content_pct: 90.0,
        certifications: ["ISO 14025"],
        validity_start: "2024-01-15",
        validity_end: "2029-01-15",
        verified_by: "EPD International",
        data_source_url: "https://buildingtransparency.org/ec3/epds/00123",
        confidence_score: 0.85 // Lower confidence than direct source
      }];
    }

    return [];
  }
}

module.exports = EC3Provider;
