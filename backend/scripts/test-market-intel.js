// backend/scripts/test-market-intel.js
const marketIntelService = require('../services/marketIntelService');

function runTests() {
  console.log('🧪 Starting Market Intel Tests...\n');

  const input = {
    supplier_name: "EcoTimber",
    product_category: "Bamboo flooring",
    current_price_per_sqft: 5.50,
    certifications: ["FSC", "FloorScore"],
    target_markets: ["West Coast US"],
    question: "Should I lower my price to compete with CaliBamboo?"
  };

  console.log('Test 1: Analyze Competitiveness for Bamboo Flooring');
  const analysis = marketIntelService.analyzeCompetitiveness(input);
  
  console.log('Your Position:', analysis.your_position.interpretation);
  console.log('Price Percentile:', analysis.your_position.price_percentile);
  
  console.log('\nCompetitor Benchmarks:');
  analysis.competitor_benchmarks.forEach(c => {
    console.log(`- ${c.competitor}: $${c.price_per_sqft} (Win Rate: ${c.win_rate_pct}%)`);
  });

  console.log('\nPricing Recommendation:');
  console.log(`Optimal Price: $${analysis.pricing_recommendation.optimal_price_per_sqft}`);
  console.log(`Rationale: ${analysis.pricing_recommendation.rationale}`);
  
  console.log('\nDemand Trends (West Coast):');
  const westCoast = analysis.demand_trends.west_coast_us;
  if (westCoast) {
    console.log(`Trend: ${westCoast.trend}`);
    console.log(`Top Certs: ${westCoast.top_certifications_requested.join(', ')}`);
  } else {
    console.error('❌ West Coast trends missing');
  }

  // Validation
  if (analysis.competitor_benchmarks.length === 3) {
    console.log('\n✅ Generated 3 mock competitors');
  } else {
    console.error('\n❌ Competitor generation failed');
  }

  if (analysis.pricing_recommendation.optimal_price_per_sqft > 0) {
    console.log('✅ Pricing recommendation generated');
  } else {
    console.error('❌ Pricing recommendation failed');
  }
}

runTests();
