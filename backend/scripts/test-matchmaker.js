// backend/scripts/test-matchmaker.js
const matchmakerService = require('../services/matchmakerService');

async function runTests() {
  console.log('🧪 Starting Matchmaker Tests...\n');

  const criteria = {
    project_type: "LEED Gold office building",
    location: "Seattle, WA",
    material_needed: "flooring",
    square_footage: 10000,
    budget: 50000,
    carbon_target_kg_co2e_per_m2: 15,
    required_certifications: ["LEED"],
    timeline: "6 weeks"
  };

  console.log('Test 1: Find matches for "flooring" in Seattle');
  console.log('Criteria:', JSON.stringify(criteria, null, 2));
  
  const matches = await matchmakerService.findMatches(criteria);
  
  console.log(`\nFound ${matches.length} matches.`);
  
  if (matches.length > 0) {
    console.log('\nTop Match:');
    console.log(JSON.stringify(matches[0], null, 2));
    
    // Validate sorting
    const scores = matches.map(m => m.match_score);
    const isSorted = scores.every((val, i, arr) => !i || (val <= arr[i - 1]));
    console.log(`\nSorted correctly? ${isSorted ? '✅ Yes' : '❌ No'}`);
    
    // Validate budget
    const budgetOk = matches.every(m => m.total_cost <= 55000); // 50k + 10%
    console.log(`Budget respected? ${budgetOk ? '✅ Yes' : '❌ No'}`);
  } else {
    console.error('❌ No matches found');
  }
  
  // Close DB connection
  const { pool } = require('../db');
  await pool.end();
}

runTests().catch(async (err) => {
  console.error(err);
  const { pool } = require('../db');
  await pool.end();
});
