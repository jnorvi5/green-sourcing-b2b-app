// backend/scripts/test-rfq-router.js
const rfqRouterService = require('../services/rfqRouterService');

async function runTests() {
  console.log('🧪 Starting RFQ Router Tests...\n');

  const rfqDetails = {
    rfq_id: "RFQ-2025-0042",
    architect_name: "Sarah Chen",
    firm: "LPA Design Studios",
    project_name: "Sustainable Community Center",
    material_needed: "FSC-certified mass timber beams",
    quantity: "50 beams, 12m length, glulam",
    location: "San Francisco, CA",
    budget: 75000,
    timeline: "6 weeks",
    certifications_required: ["FSC", "LEED"],
    urgency: "High - project starts Dec 1"
  };

  console.log('Test 1: Route RFQ for Mass Timber');
  const analysis = await rfqRouterService.routeRFQ(rfqDetails);
  
  console.log('RFQ ID:', analysis.rfq_id);
  console.log('Suppliers Selected:', Object.keys(analysis.suppliers_to_notify).length);
  console.log('Conversion Prediction:', analysis.conversion_optimization.predicted_conversion_rate);
  console.log('Urgency:', analysis.conversion_optimization.rfq_urgency);
  
  console.log('\nTop Supplier Match:');
  const topSupplier = analysis.suppliers_to_notify.supplier_1;
  console.log('Name:', topSupplier.name);
  console.log('Score:', topSupplier.match_score);
  console.log('Why:', topSupplier.why_selected);
  console.log('Suggested Response:', topSupplier.suggested_response);

  // Validation
  if (Object.keys(analysis.suppliers_to_notify).length === 3) {
    console.log('\n✅ Correctly routed to 3 suppliers');
  } else {
    console.error('\n❌ Incorrect number of suppliers');
  }

  if (analysis.conversion_optimization.suggested_actions.some(a => a.includes("urgency"))) {
    console.log('✅ Urgency detected correctly');
  } else {
    console.error('❌ Urgency detection failed');
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
