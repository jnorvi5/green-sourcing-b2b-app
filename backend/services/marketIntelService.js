// backend/services/marketIntelService.js

class MarketIntelService {
  
  /**
   * Analyze Competitiveness
   * @param {Object} input 
   * @returns {Object} Competitive Analysis Report
   */
  analyzeCompetitiveness(input) {
    const {
      supplier_name,
      product_category,
      current_price_per_sqft,
      certifications,
      target_markets
    } = input;

    console.log(`[Market Intel] Analyzing for: ${supplier_name} (${product_category})`);

    // 1. Generate Mock Competitors
    const competitors = this.generateMockCompetitors(product_category, current_price_per_sqft);

    // 2. Analyze Position
    // Calculate percentile
    const allPrices = [...competitors.map(c => c.price_per_sqft), current_price_per_sqft].sort((a, b) => a - b);
    const rank = allPrices.indexOf(current_price_per_sqft);
    const percentile = Math.round((rank / (allPrices.length - 1)) * 100);
    
    let interpretation = "You are priced competitively.";
    if (percentile > 75) interpretation = "You're in the top 25% most expensive.";
    else if (percentile < 25) interpretation = "You're in the bottom 25% cheapest.";

    // 3. Pricing Recommendation
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price_per_sqft, 0) / competitors.length;
    // Premium for certifications (Mock logic)
    const hasFSC = certifications.includes("FSC");
    const hasFloorScore = certifications.includes("FloorScore");
    
    let targetPrice = avgCompetitorPrice;
    if (hasFSC) targetPrice *= 1.10; // 10% premium
    if (hasFloorScore) targetPrice *= 1.05; // 5% premium
    
    // Round to nearest 0.05
    targetPrice = Math.round(targetPrice * 20) / 20;

    const recommendation = {
      optimal_price_per_sqft: targetPrice,
      rationale: `Market average is $${avgCompetitorPrice.toFixed(2)}. Your certifications justify a premium to $${targetPrice.toFixed(2)}.`,
      projected_impact: {
        win_rate_increase_pct: Math.abs(current_price_per_sqft - targetPrice) > 0.5 ? 15 : 5,
        monthly_rfq_volume_increase: 8
      }
    };

    // 4. Demand Trends (Mocked)
    const region = target_markets[0] || "National";
    const demandTrends = {
      [region.toLowerCase().replace(/ /g, '_')]: {
        [`${product_category.toLowerCase().replace(/ /g, '_')}_rfqs_last_30_days`]: Math.floor(Math.random() * 50) + 20,
        trend: `+${Math.floor(Math.random() * 30)}% vs. last month`,
        top_certifications_requested: ["FSC", "LEED", "FloorScore"],
        avg_budget_per_project: 50000 + Math.floor(Math.random() * 20000),
        fastest_growing_segment: "LEED Platinum projects (+35% MoM)"
      },
      competitive_threat_alert: `Competitor in ${region} launched promo pricing - expect 10-15% RFQ volume loss unless you respond.`
    };

    // 5. Certification ROI
    const certRoi = {
      fsc: {
        value: "High - 80% of RFQs require FSC",
        premium_justified_pct: 10
      },
      floorscore: {
        value: "Medium - 45% of RFQs mention VOC limits",
        premium_justified_pct: 5
      },
      recommended_next_cert: "Cradle to Cradle Bronze (cost: $5K, ROI: 12% win rate boost)"
    };

    // 6. Actionable Recommendations
    const actions = [
      `Pricing: Adjust to $${targetPrice.toFixed(2)}/sqft to optimize win rate vs margin.`,
      `Marketing: Highlight ${certifications[0] || 'quality'} in RFQ responses.`,
      `Geographic: Expand delivery to Portland, OR (high demand growth).`
    ];

    return {
      your_position: {
        price_percentile: percentile,
        interpretation
      },
      competitor_benchmarks: competitors,
      pricing_recommendation: recommendation,
      certification_roi: certRoi,
      demand_trends: demandTrends,
      actionable_recommendations: actions
    };
  }

  generateMockCompetitors(category, currentPrice) {
    // Generate 3 competitors around the current price
    const basePrice = currentPrice * 0.9;
    return [
      {
        competitor: "Competitor A",
        price_per_sqft: parseFloat((basePrice * (0.8 + Math.random() * 0.4)).toFixed(2)),
        certifications: ["FSC", "LEED"],
        win_rate_pct: Math.floor(Math.random() * 30) + 50,
        avg_delivery_weeks: 3
      },
      {
        competitor: "Competitor B",
        price_per_sqft: parseFloat((basePrice * (0.8 + Math.random() * 0.4)).toFixed(2)),
        certifications: ["FSC"],
        win_rate_pct: Math.floor(Math.random() * 30) + 40,
        avg_delivery_weeks: 4
      },
      {
        competitor: "Competitor C",
        price_per_sqft: parseFloat((basePrice * (0.8 + Math.random() * 0.4)).toFixed(2)),
        certifications: ["Cradle to Cradle"],
        win_rate_pct: Math.floor(Math.random() * 30) + 60,
        avg_delivery_weeks: 2
      }
    ];
  }
}

module.exports = new MarketIntelService();
