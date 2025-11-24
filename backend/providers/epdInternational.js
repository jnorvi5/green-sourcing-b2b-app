// backend/providers/epdInternational.js
// Mock provider for EPD International

class EPDInternationalProvider {
  constructor() {
    this.name = 'EPD International';
    this.priority = 1; // Highest priority
  }

  /**
   * Search for EPDs
   * @param {string} query - Search query (product name, etc.)
   * @returns {Promise<Array>} - List of EPD objects
   */
  async search(query) {
    console.log(`[${this.name}] Searching for: ${query}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock data based on query
    if (query.toLowerCase().includes('steel') || query.toLowerCase().includes('rebar')) {
      return [{
        product_name: "Recycled Steel Rebar",
        manufacturer: "SteelCorp Industries",
        epd_number: "S-P-00123",
        gwp_fossil_a1_a3: 450.2, // kg CO2e
        recycled_content_pct: 95.0,
        certifications: ["ISO 14025", "EN 15804"],
        validity_start: "2024-01-15",
        validity_end: "2029-01-15",
        verified_by: "EPD International",
        data_source_url: "https://www.environdec.com/library/epd123",
        confidence_score: 0.95
      }];
    }
    
    if (query.toLowerCase().includes('insulation') || query.toLowerCase().includes('warmcel')) {
      return [{
        product_name: "Warmcel Cellulose Insulation",
        manufacturer: "Warmcel",
        epd_number: "S-P-00456",
        gwp_fossil_a1_a3: 0.15, // kg CO2e per kg? usually per declared unit
        recycled_content_pct: 100.0,
        certifications: ["ISO 14025", "Natureplus"],
        validity_start: "2023-06-01",
        validity_end: "2028-06-01",
        verified_by: "EPD International",
        data_source_url: "https://www.environdec.com/library/epd456",
        confidence_score: 0.98
      }];
    }

    return [];
  }

  /**
   * Validate an EPD
   * @param {Object} epd - EPD object
   * @returns {Object} - Validation result
   */
  validate(epd) {
    const now = new Date();
    const validEnd = new Date(epd.validity_end);
    const isExpired = now > validEnd;
    
    return {
      isValid: !isExpired,
      warnings: isExpired ? ['EPD has expired'] : [],
      provider: this.name
    };
  }
}

module.exports = EPDInternationalProvider;
