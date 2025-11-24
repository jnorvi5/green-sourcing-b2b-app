// backend/scripts/test-compliance-oracle.js
const complianceOracleService = require('../services/complianceOracleService');

function runTests() {
  console.log('🧪 Starting Compliance Oracle Tests...\n');

  const projectData = {
    project_name: "Green Office Tower Seattle",
    certification_target: "LEED Gold",
    location: "Seattle, WA",
    total_sqft: 50000,
    project_carbon_budget_kg_co2e: 750000,
    materials_selected: [
      {
        material_type: "Structural steel",
        quantity_tons: 500,
        supplier: "RecycledSteel Co",
        gwp_fossil_kg_co2e: 450, // per ton
        recycled_content_pct: 95,
        epd_verified: true,
        fsc_certified: false
      },
      {
        material_type: "Concrete",
        quantity_m3: 2000,
        supplier: "CarbonCure NW",
        gwp_fossil_kg_co2e: 280, // per m3
        recycled_content_pct: 30,
        epd_verified: true
      },
      {
        material_type: "Low-VOC Paint",
        quantity_units: 500,
        supplier: "EcoPaint",
        gwp_fossil_kg_co2e: 10,
        recycled_content_pct: 0,
        epd_verified: false
      }
    ]
  };

  console.log('Test 1: Generate Report');
  const report = complianceOracleService.generateComplianceReport(projectData);
  
  console.log('Project:', report.project_name);
  console.log('LEED Credits:', report.leed_credit_calculation.total_credits_earned);
  console.log('Buy Clean Status:', report.buy_clean_act_compliance.compliance_status);
  console.log('Carbon Budget Status:', report.embodied_carbon_budget_tracking.status);
  
  console.log('\nDetailed Report Structure:');
  console.log(JSON.stringify(report, null, 2));

  // Validation
  if (report.leed_credit_calculation.total_credits_earned > 0) {
    console.log('\n✅ LEED calculation working');
  } else {
    console.error('\n❌ LEED calculation failed');
  }

  if (report.buy_clean_act_compliance.gwp_limits_check["Structural steel"]) {
    console.log('✅ Buy Clean check working');
  } else {
    console.error('❌ Buy Clean check failed');
  }
}

runTests();
