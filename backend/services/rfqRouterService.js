// backend/services/rfqRouterService.js
const { pool } = require('../db');

class RFQRouterService {
  
  /**
   * Route RFQ to best suppliers
   * @param {Object} rfqDetails 
   * @returns {Promise<Object>} Routing Analysis
   */
  async routeRFQ(rfqDetails) {
    const {
      rfq_id,
      architect_name,
      project_name,
      material_needed,
      quantity,
      location,
      budget,
      timeline,
      certifications_required,
      urgency
    } = rfqDetails;

    console.log(`[RFQ Router] Routing RFQ for: ${material_needed} in ${location}`);

    // 1. MATCH: Find suppliers with capability
    // Query DB for suppliers with relevant products
    // Mocking the "capability matching" by text search on Products table
    
    let candidates = [];
    try {
      const query = `
        SELECT 
          s.SupplierID,
          c.CompanyName as name,
          c.Address,
          p.ProductName,
          p.LeadTimeDays
        FROM Suppliers s
        JOIN Companies c ON s.CompanyID = c.CompanyID
        JOIN Products p ON s.SupplierID = p.SupplierID
        WHERE p.ProductName ILIKE $1 OR p.Description ILIKE $1
      `;
      const result = await pool.query(query, [`%${material_needed.split(' ')[0]}%`]); // Simple keyword match
      candidates = result.rows;
    } catch (err) {
      console.error('[RFQ Router] DB Query failed (using mocks):', err.message);
      candidates = [];
    }

    // If no DB candidates, use mocks for demo
    if (candidates.length === 0) {
      candidates = this.generateMockCandidates(material_needed);
    }

    // 2. FILTER & RANK
    const scoredCandidates = candidates.map(candidate => {
      // Mock Data for Ranking
      const distanceKm = this.calculateMockDistance(location, candidate.Address || 'Unknown');
      const winRate = Math.random() * 0.4 + 0.5; // 50-90%
      const responseTime = Math.floor(Math.random() * 24) + 1; // 1-24 hours
      const quoteAccuracy = Math.floor(Math.random() * 10) + 90; // 90-100%
      
      // Filter: Distance > 500km (Soft filter, just lower score)
      let score = 100;
      if (distanceKm > 500) score -= 20;
      
      // Filter: Certifications (Mock check)
      // Assume 80% chance they have it for demo
      const hasCerts = Math.random() > 0.2;
      if (!hasCerts) score -= 30;

      // Rank by Win Rate
      score += (winRate * 50); // Weight win rate heavily

      return {
        ...candidate,
        match_score: parseFloat((score / 150).toFixed(2)), // Normalize roughly 0-1
        distance_km: distanceKm,
        historical_metrics: {
          avg_response_time_hours: responseTime,
          quote_accuracy_pct: quoteAccuracy,
          win_rate_similar_rfqs_pct: Math.round(winRate * 100),
          avg_delivery_time_weeks: Math.ceil((candidate.LeadTimeDays || 28) / 7)
        },
        why_selected: `${hasCerts ? 'Matches certifications' : 'Partial cert match'}, ${distanceKm}km from site, ${Math.round(winRate * 100)}% win rate.`
      };
    });

    // Sort by score
    scoredCandidates.sort((a, b) => b.match_score - a.match_score);
    
    // Select Top 3
    const top3 = scoredCandidates.slice(0, 3);

    // 3. CONVERSION OPTIMIZATION
    const isUrgent = urgency && urgency.toLowerCase().includes('high');
    const predictedConversion = 0.6 + (top3[0]?.match_score * 0.2); // Base 60% + score boost

    const suggestedActions = [];
    if (isUrgent) suggestedActions.push("Notify suppliers within 1 hour (urgency detection)");
    suggestedActions.push(`Auto-send response template to ${top3[0]?.name} (highest win rate)`);
    if (top3[0]?.historical_metrics.avg_response_time_hours > 12) {
      suggestedActions.push("Flag for founder follow-up if no response in 24 hours");
    }

    // 4. GENERATE NOTIFICATIONS
    const suppliersOutput = {};
    top3.forEach((s, index) => {
      suppliersOutput[`supplier_${index + 1}`] = {
        name: s.name,
        match_score: s.match_score,
        why_selected: s.why_selected,
        historical_metrics: s.historical_metrics,
        suggested_response: `Hi ${architect_name}, we can supply ${material_needed}. Delivery in ${s.historical_metrics.avg_delivery_time_weeks} weeks. Preliminary quote: $${(budget * (0.9 + Math.random()*0.2)).toFixed(0)}. Schedule call?`
      };
    });

    return {
      rfq_id,
      suppliers_to_notify: suppliersOutput,
      conversion_optimization: {
        rfq_urgency: urgency || "Normal",
        suggested_actions: suggestedActions,
        predicted_conversion_rate: parseFloat(predictedConversion.toFixed(2)),
        estimated_deal_value: budget
      },
      notification_template: {
        subject: `RFQ Match - ${material_needed}, ${location} ($${budget/1000}K, ${timeline})`,
        body_preview: `Hi [Supplier Contact],\n\nYou've been matched with a high-priority RFQ from ${architect_name}...\n\nWhy you're a great fit:\n- Win rate: ${top3[0]?.historical_metrics.win_rate_similar_rfqs_pct}%\n- Delivery: ${top3[0]?.historical_metrics.avg_delivery_time_weeks} weeks`
      }
    };
  }

  // Helper: Mock Candidates
  generateMockCandidates(material) {
    return [
      { name: "Structurlam", Address: "Penticton, BC", LeadTimeDays: 28 },
      { name: "Nordic Structures", Address: "Montreal, QC", LeadTimeDays: 35 },
      { name: "Mass Timber NW", Address: "Portland, OR", LeadTimeDays: 21 },
      { name: "TimberBuilt", Address: "Buffalo, NY", LeadTimeDays: 42 },
      { name: "EcoWood Systems", Address: "Seattle, WA", LeadTimeDays: 14 }
    ];
  }

  // Helper: Mock Distance
  calculateMockDistance(origin, destination) {
    const str = String(origin) + String(destination);
    let hash = 0;
    const MAX_STR_LEN = 1024;
    const boundedLength = Math.min(str.length, MAX_STR_LEN);
    for (let i = 0; i < boundedLength; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash % 3000) + 50; // 50-3050km
  }
}

module.exports = new RFQRouterService();
