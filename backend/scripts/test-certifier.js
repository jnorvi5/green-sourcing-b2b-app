// backend/scripts/test-certifier.js
const certifierService = require('../services/certifierService');

function runTests() {
  console.log('🧪 Starting Certifier Tests...\n');

  // Test 1: Partially Ready Input
  const input1 = {
    product_name: "Recycled Cellulose Insulation",
    manufacturer: "GreenInsulate LLC",
    manufacturing_location: "Portland, OR",
    raw_materials: [
      {"material": "Recycled newsprint", "percentage": 85},
      {"material": "Boric acid", "percentage": 15}
    ],
    energy_consumption_kwh_per_unit: 2.5,
    lca_completed: false
  };

  console.log('Test 1: Partially Ready Input');
  const result1 = certifierService.assessReadiness(input1);
  console.log('Readiness Score:', result1.readiness_score);
  console.log('Status:', result1.status);
  console.log('Missing Requirements:', result1.missing_requirements);
  console.log('Estimated Cost:', result1.estimated_cost);
  console.log('\n-----------------------------------\n');

  // Test 2: Fully Ready Input
  const input2 = {
    product_name: "Eco-Wood Flooring",
    manufacturer: "NatureFloors",
    raw_materials: [{"material": "Oak", "percentage": 100}],
    energy_data_available: true,
    manufacturing_flow_diagram: true,
    lca_completed: true,
    lca_standard: "ISO 14040",
    target_certification: "EPD International"
  };

  console.log('Test 2: Fully Ready Input');
  const result2 = certifierService.assessReadiness(input2);
  console.log('Readiness Score:', result2.readiness_score);
  console.log('Status:', result2.status);
  
  if (result2.readiness_score >= 90) {
    console.log('✅ Correctly identified as Ready');
  } else {
    console.error('❌ Failed to identify as Ready');
  }
}

runTests();
