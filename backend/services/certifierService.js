// backend/services/certifierService.js

class CertifierService {
  
  /**
   * Assess EPD readiness
   * @param {Object} input - Contractor input
   * @returns {Object} Assessment result
   */
  assessReadiness(input) {
    const {
      product_name,
      manufacturer,
      raw_materials,
      existing_certifications,
      target_certification,
      lca_completed, // Boolean: has LCA been done?
      lca_standard, // String: e.g., "ISO 14040"
      energy_data_available, // Boolean
      manufacturing_flow_diagram // Boolean
    } = input;

    console.log(`[Certifier] Assessing readiness for: ${product_name} (${manufacturer})`);

    // 1. Calculate Readiness Score
    let score = 0;
    const maxScore = 100;
    const missing = [];
    const nextSteps = [];

    // Basic Info (10%)
    if (product_name && manufacturer) score += 10;

    // Material Data (20%)
    if (raw_materials && raw_materials.length > 0) {
      score += 20;
    } else {
      missing.push("Bill of Materials (Raw materials breakdown)");
      nextSteps.push("Compile a complete Bill of Materials (BOM) with weight percentages.");
    }

    // Energy/Process Data (20%)
    if (energy_data_available) {
      score += 20;
    } else {
      missing.push("Energy consumption data (12 months)");
      nextSteps.push("Gather energy bills (electricity, gas) for the last 12 months.");
    }

    if (manufacturing_flow_diagram) {
      score += 5; // Bonus
    } else {
      nextSteps.push("Prepare a manufacturing process flow diagram.");
    }

    // LCA Status (40%)
    if (lca_completed) {
      score += 40;
      if (lca_standard && (lca_standard.includes("14040") || lca_standard.includes("14044"))) {
        score += 10; // Bonus for standard compliance
      } else {
        missing.push("LCA compliance check (ISO 14040/14044)");
        nextSteps.push("Verify LCA report against ISO 14040/14044 standards.");
      }
    } else {
      missing.push("LCA cradle-to-gate analysis (A1-A3 modules)");
      missing.push("Third-party verified LCA report");
      nextSteps.push("Commission LCA study (A1-A3 modules).");
    }

    // PCR Selection (10%)
    // Heuristic: Check if target cert implies a PCR
    if (target_certification) {
      score += 10;
    } else {
      missing.push("Target Certification Body selection");
      nextSteps.push("Select a target certification body (e.g., EPD International).");
    }

    // Cap score
    score = Math.min(score, 100);

    // 2. Determine Status
    let status = "Not Ready";
    if (score >= 90) status = "Ready for Submission";
    else if (score >= 50) status = "Partially Ready";
    else status = "Early Stage";

    // 3. Estimate Cost & Timeline
    // Heuristics based on industry averages
    let lcaCost = 8000;
    let verificationCost = 3000;
    let timelineWeeks = 24; // 6 months default

    // Adjust based on readiness
    if (lca_completed) {
      lcaCost = 0;
      timelineWeeks -= 12; // LCA takes ~3 months
    }
    
    // GreenChainz discount logic
    const greenChainzLcaCost = 4500;
    
    const estimatedCost = {
      lca_study: lcaCost,
      epd_verification: verificationCost,
      total: lcaCost + verificationCost
    };

    const estimatedTimeline = `${Math.max(4, timelineWeeks - (score > 70 ? 4 : 0))} weeks`;

    // 4. PCR Recommendation
    let pcrRecommendation = "General Construction Products (EN 15804)";
    if (product_name.toLowerCase().includes("insulation")) {
      pcrRecommendation = "Insulation materials (EN 15804 + specific rules)";
    } else if (product_name.toLowerCase().includes("wood") || product_name.toLowerCase().includes("flooring")) {
      pcrRecommendation = "Wood and wood-based products (EN 16485)";
    } else if (product_name.toLowerCase().includes("concrete")) {
      pcrRecommendation = "Concrete and concrete elements (EN 16757)";
    }
    
    if (!lca_completed) {
      nextSteps.unshift(`Select PCR: ${pcrRecommendation}`);
    }

    // 5. Construct Response
    return {
      readiness_score: score,
      status: status,
      missing_requirements: missing,
      estimated_cost: estimatedCost,
      estimated_timeline: estimatedTimeline,
      next_steps: nextSteps,
      greenchainz_accelerator_offer: {
        service: "EPD Fast-Track Gold",
        price: lca_completed ? 2999 : 5999, // Cheaper if LCA done
        includes: [
          lca_completed ? "LCA review" : "LCA study coordination",
          "EPD document preparation",
          "Submission to " + (target_certification || "EPD International"),
          "Revision support (up to 2 rounds)"
        ],
        guarantee: "Certification within 12 weeks or refund"
      }
    };
  }
}

module.exports = new CertifierService();
