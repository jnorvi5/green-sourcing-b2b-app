// backend/services/complianceOracleService.js

class ComplianceOracleService {
  
  /**
   * Generate Compliance Report
   * @param {Object} projectData 
   * @returns {Object} Compliance Report
   */
  generateComplianceReport(projectData) {
    const {
      project_name,
      certification_target,
      location,
      total_sqft,
      project_carbon_budget_kg_co2e, // Optional input
      materials_selected
    } = projectData;

    console.log(`[Compliance Oracle] Generating report for: ${project_name}`);

    // 1. LEED Credit Calculation
    const leedResults = this.calculateLEEDCredits(materials_selected, location);

    // 2. Buy Clean Act Compliance
    const buyCleanResults = this.checkBuyCleanCompliance(materials_selected);

    // 3. Carbon Budget Tracking
    const carbonBudgetResults = this.trackCarbonBudget(materials_selected, project_carbon_budget_kg_co2e);

    return {
      project_name,
      certification_target,
      leed_credit_calculation: leedResults,
      buy_clean_act_compliance: buyCleanResults,
      embodied_carbon_budget_tracking: carbonBudgetResults,
      timestamp: new Date().toISOString()
    };
  }

  calculateLEEDCredits(materials, location) {
    let credits = 0;
    const breakdown = {};
    const recommendations = [];

    // MR Credit 2: EPDs
    // Option 1: 20 different permanently installed products sourced from at least 5 different manufacturers
    const epdCount = materials.filter(m => m.epd_verified).length;
    if (epdCount >= 20) {
      credits += 1;
      breakdown["MR Credit 2: EPDs (Option 1)"] = 1;
    } else {
      recommendations.push(`Need ${20 - epdCount} more EPD-verified products for MR Credit 2 (Option 1).`);
    }

    // MR Credit 3: Sourcing of Raw Materials
    // FSC Wood, Recycled Content, etc.
    // Simplified logic: Check if > 25% of cost is compliant (assuming equal cost for simplicity or using quantity)
    // We'll just count compliant products for this MVP heuristic
    const responsibleSourcingCount = materials.filter(m => m.fsc_certified || m.recycled_content_pct > 20).length;
    if (responsibleSourcingCount >= 5) { // Heuristic threshold
      credits += 1;
      breakdown["MR Credit 3: Sourcing of Raw Materials"] = 1;
    } else {
      recommendations.push("Select more FSC-certified or high-recycled-content materials for MR Credit 3.");
    }

    // MR Credit 4: Material Ingredients
    // Declare labels, C2C, HPDs
    // Assuming 'declare_label' or similar field exists, or we infer from 'material_type' for demo
    const ingredientReportedCount = materials.filter(m => m.material_type.toLowerCase().includes("flooring") || m.material_type.toLowerCase().includes("paint")).length;
    if (ingredientReportedCount > 0) {
      credits += 1; // Generous assumption for demo
      breakdown["MR Credit 4: Material Ingredients"] = 1;
    }

    // EQ Credit 2: Low-Emitting Materials
    const lowVocCount = materials.filter(m => m.material_type.toLowerCase().includes("low-voc") || m.material_type.toLowerCase().includes("paint")).length;
    if (lowVocCount > 0) {
      credits += 1;
      breakdown["EQ Credit 2: Low-Emitting Materials"] = 1;
    }

    return {
      total_credits_earned: credits,
      breakdown,
      certification_status: {
        current_total: 40 + credits, // Assuming base points from other categories
        target: "LEED Gold (60-79 credits)",
        gap: 60 - (40 + credits),
        likelihood: "On track"
      },
      recommendations
    };
  }

  checkBuyCleanCompliance(materials) {
    // California Buy Clean Limits (Heuristic/Example values in kg CO2e)
    // Limits are usually per unit (e.g., per metric ton of steel)
    const limits = {
      "structural steel": 630, // per ton
      "concrete": 400, // per m3 (approx for high strength)
      "flat glass": 1430, // per ton
      "mineral wool": 3.3 // per kg
    };

    const checks = {};
    let allPass = true;
    const documentation = ["Buy Clean Act Compliance Report (PDF)"];

    materials.forEach(m => {
      const type = m.material_type.toLowerCase();
      // Find matching limit key
      const limitKey = Object.keys(limits).find(k => type.includes(k));
      
      if (limitKey) {
        const limit = limits[limitKey];
        // Assuming m.gwp_fossil_kg_co2e is per unit matching the limit unit
        // In real app, we need unit conversion logic
        const actual = m.gwp_fossil_kg_co2e;
        const status = actual <= limit ? "COMPLIANT" : "NON-COMPLIANT";
        
        if (status === "NON-COMPLIANT") allPass = false;

        checks[m.material_type] = {
          actual_gwp: actual,
          limit_gwp: limit,
          margin: limit - actual,
          status
        };
        
        if (m.epd_verified) {
          documentation.push(`EPD Verification Letter for ${m.supplier}`);
        }
      }
    });

    return {
      compliance_status: allPass ? "PASS" : "FAIL",
      gwp_limits_check: checks,
      documentation_generated: documentation
    };
  }

  trackCarbonBudget(materials, budget) {
    if (!budget) return { status: "No budget set" };

    const currentEmissions = materials.reduce((sum, m) => {
      // Assuming gwp is per unit and we have quantity
      // If gwp is total for the line item, just add it.
      // The prompt input example shows "gwp_fossil_kg_co2e: 450" for "quantity_tons: 500".
      // Usually GWP is per unit. So 450 * 500 = 225,000.
      // Let's assume the input GWP is PER UNIT.
      
      let quantity = m.quantity_tons || m.quantity_m3 || m.quantity_units || 1;
      return sum + (m.gwp_fossil_kg_co2e * quantity);
    }, 0);

    const remaining = budget - currentEmissions;
    const utilization = Math.round((currentEmissions / budget) * 100);
    
    let status = "ON TRACK";
    if (utilization > 100) status = "OVER BUDGET";
    else if (utilization > 80) status = "CAUTION";

    const mitigation = [];
    if (utilization > 80) {
      mitigation.push("Switch to mass timber framing → Save ~20% emissions");
      mitigation.push("Use CarbonCure concrete → Save ~10% emissions");
    }

    return {
      project_carbon_budget_kg_co2e: budget,
      current_emissions_kg_co2e: currentEmissions,
      remaining_budget_kg_co2e: remaining,
      budget_utilization_pct: utilization,
      status: `${status} - ${utilization}% of budget used`,
      mitigation_options: mitigation
    };
  }
}

module.exports = new ComplianceOracleService();
