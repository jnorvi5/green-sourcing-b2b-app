// Carbon calculation models and service
export interface MaterialCarbonData {
    materialId: string;
    name: string;
    gwp: number; // kg CO2e per unit
    unit: string;
    quantity: number;
    totalCarbon: number;
    alternativeGwp?: number;
    carbonSaved?: number;
}

export interface ProjectCarbonAnalysis {
    projectId: string; // Changed from ObjectId
    userId: string;    // Changed from ObjectId
    name: string;
    description?: string;
    location?: {
        city?: string;
        state?: string;
        country?: string;
    };
    buildingType?: string;
    squareFootage?: number;
    materials: MaterialCarbonData[];
    summary: {
        totalCarbon: number; // kg CO2e
        carbonPerSqFt?: number;
        carbonSaved: number;
        potentialSavings: number;
        percentReduction: number;
    };
    benchmarks: {
        industryAverage?: number;
        bestInClass?: number;
        percentile?: number;
    };
    recommendations: {
        materialId: string;
        currentMaterial: string;
        suggestedMaterial: string;
        currentGwp: number;
        suggestedGwp: number;
        potentialSavings: number;
    }[];
    createdAt: Date;
    updatedAt: Date;
}

// Industry benchmark data (kg CO2e per sq ft)
const BUILDING_BENCHMARKS: Record<string, { average: number; bestInClass: number }> = {
    office: { average: 35, bestInClass: 18 },
    residential: { average: 28, bestInClass: 14 },
    retail: { average: 32, bestInClass: 16 },
    healthcare: { average: 45, bestInClass: 25 },
    education: { average: 30, bestInClass: 15 },
    industrial: { average: 40, bestInClass: 22 },
    hospitality: { average: 38, bestInClass: 20 },
    default: { average: 35, bestInClass: 18 },
};

// Alternative material suggestions with lower GWP
const MATERIAL_ALTERNATIVES: Record<string, { name: string; gwpReduction: number }[]> = {
    concrete: [
        { name: 'Low-carbon concrete', gwpReduction: 0.3 },
        { name: 'Geopolymer concrete', gwpReduction: 0.7 },
        { name: 'Carbon-cured concrete', gwpReduction: 0.5 },
    ],
    steel: [
        { name: 'Recycled steel', gwpReduction: 0.6 },
        { name: 'Electric arc furnace steel', gwpReduction: 0.4 },
    ],
    aluminum: [
        { name: 'Recycled aluminum', gwpReduction: 0.9 },
    ],
    insulation: [
        { name: 'Cellulose insulation', gwpReduction: 0.8 },
        { name: 'Cork insulation', gwpReduction: 0.85 },
    ],
    lumber: [
        { name: 'FSC certified wood', gwpReduction: 0.1 },
        { name: 'Cross-laminated timber', gwpReduction: 0.2 },
    ],
    glass: [
        { name: 'Recycled glass', gwpReduction: 0.3 },
    ],
};

class CarbonCalculatorService {
    // Calculate carbon for a single material
    calculateMaterialCarbon(
        gwp: number,
        quantity: number,
        unit: string
    ): number {
        // Convert to kg CO2e based on unit
        const multipliers: Record<string, number> = {
            kg: 1,
            lb: 0.453592,
            ton: 1000,
            m3: 1, // Assumes density already factored into GWP
            ft3: 0.0283168,
            sqm: 1,
            sqft: 0.092903,
        };

        const multiplier = multipliers[unit.toLowerCase()] || 1;
        return gwp * quantity * multiplier;
    }

    // Calculate total project carbon
    calculateProjectCarbon(
        materials: Array<{
            name: string;
            gwp: number;
            unit: string;
            quantity: number;
            alternativeGwp?: number;
        }>
    ): {
        materials: MaterialCarbonData[];
        totalCarbon: number;
        carbonSaved: number;
        potentialSavings: number;
    } {
        let totalCarbon = 0;
        let carbonSaved = 0;
        let potentialSavings = 0;

        const calculatedMaterials: MaterialCarbonData[] = materials.map((mat, index) => {
            const materialCarbon = this.calculateMaterialCarbon(mat.gwp, mat.quantity, mat.unit);
            totalCarbon += materialCarbon;

            let savings = 0;
            if (mat.alternativeGwp) {
                const alternativeCarbon = this.calculateMaterialCarbon(mat.alternativeGwp, mat.quantity, mat.unit);
                savings = alternativeCarbon - materialCarbon;
                if (savings > 0) {
                    carbonSaved += savings;
                }
            }

            // Calculate potential savings from suggested alternatives
            const materialType = this.detectMaterialType(mat.name);
            const alternatives = MATERIAL_ALTERNATIVES[materialType] || [];
            if (alternatives.length > 0) {
                const bestAlternative = alternatives.reduce((best, alt) =>
                    alt.gwpReduction > best.gwpReduction ? alt : best
                );
                const potentialCarbon = materialCarbon * (1 - bestAlternative.gwpReduction);
                potentialSavings += materialCarbon - potentialCarbon;
            }

            return {
                materialId: `mat-${index}`,
                name: mat.name,
                gwp: mat.gwp,
                unit: mat.unit,
                quantity: mat.quantity,
                totalCarbon: materialCarbon,
                alternativeGwp: mat.alternativeGwp,
                carbonSaved: savings,
            };
        });

        return {
            materials: calculatedMaterials,
            totalCarbon,
            carbonSaved,
            potentialSavings,
        };
    }

    // Detect material type for alternative suggestions
    private detectMaterialType(name: string): string {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('concrete') || lowerName.includes('cement')) return 'concrete';
        if (lowerName.includes('steel') || lowerName.includes('rebar')) return 'steel';
        if (lowerName.includes('aluminum') || lowerName.includes('aluminium')) return 'aluminum';
        if (lowerName.includes('insulation')) return 'insulation';
        if (lowerName.includes('lumber') || lowerName.includes('wood') || lowerName.includes('timber')) return 'lumber';
        if (lowerName.includes('glass')) return 'glass';
        return 'other';
    }

    // Generate recommendations for carbon reduction
    generateRecommendations(
        materials: MaterialCarbonData[]
    ): ProjectCarbonAnalysis['recommendations'] {
        const recommendations: ProjectCarbonAnalysis['recommendations'] = [];

        materials.forEach(mat => {
            const materialType = this.detectMaterialType(mat.name);
            const alternatives = MATERIAL_ALTERNATIVES[materialType] || [];

            if (alternatives.length > 0) {
                const bestAlternative = alternatives.reduce((best, alt) =>
                    alt.gwpReduction > best.gwpReduction ? alt : best
                );

                const suggestedGwp = mat.gwp * (1 - bestAlternative.gwpReduction);
                const potentialSavings = mat.totalCarbon - (mat.totalCarbon * (1 - bestAlternative.gwpReduction));

                if (potentialSavings > 0) {
                    recommendations.push({
                        materialId: mat.materialId,
                        currentMaterial: mat.name,
                        suggestedMaterial: bestAlternative.name,
                        currentGwp: mat.gwp,
                        suggestedGwp,
                        potentialSavings,
                    });
                }
            }
        });

        // Sort by potential savings (highest first)
        return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
    }

    // Calculate benchmarks for a project
    calculateBenchmarks(
        totalCarbon: number,
        squareFootage: number,
        buildingType: string
    ): ProjectCarbonAnalysis['benchmarks'] {
        const carbonPerSqFt = squareFootage > 0 ? totalCarbon / squareFootage : 0;
        const benchmarkData = BUILDING_BENCHMARKS[buildingType.toLowerCase()] || BUILDING_BENCHMARKS['default'];

        // Calculate percentile (simplified)
        const range = benchmarkData.average - benchmarkData.bestInClass;
        const position = benchmarkData.average - carbonPerSqFt;
        const percentile = Math.max(0, Math.min(100, (position / range) * 100));

        return {
            industryAverage: benchmarkData.average,
            bestInClass: benchmarkData.bestInClass,
            percentile: Math.round(percentile),
        };
    }

    // Create full carbon analysis
    async analyzeProject(data: {
        userId: string;
        name: string;
        description?: string;
        location?: ProjectCarbonAnalysis['location'];
        buildingType?: string;
        squareFootage?: number;
        materials: Array<{
            name: string;
            gwp: number;
            unit: string;
            quantity: number;
            alternativeGwp?: number;
        }>;
    }): Promise<{
        materials: MaterialCarbonData[];
        summary: ProjectCarbonAnalysis['summary'];
        benchmarks: ProjectCarbonAnalysis['benchmarks'];
        recommendations: ProjectCarbonAnalysis['recommendations'];
    }> {
        // Calculate carbon for all materials
        const { materials, totalCarbon, carbonSaved, potentialSavings } =
            this.calculateProjectCarbon(data.materials);

        // Calculate carbon per square foot if available
        const carbonPerSqFt = data.squareFootage && data.squareFootage > 0
            ? totalCarbon / data.squareFootage
            : undefined;

        // Calculate percent reduction
        const baselineCarbon = totalCarbon + carbonSaved;
        const percentReduction = baselineCarbon > 0
            ? ((carbonSaved / baselineCarbon) * 100)
            : 0;

        // Generate benchmarks
        const benchmarks = data.squareFootage && data.buildingType
            ? this.calculateBenchmarks(totalCarbon, data.squareFootage, data.buildingType)
            : { industryAverage: undefined, bestInClass: undefined, percentile: undefined };

        // Generate recommendations
        const recommendations = this.generateRecommendations(materials);

        const summary: ProjectCarbonAnalysis['summary'] = {
            totalCarbon,
            carbonPerSqFt,
            carbonSaved,
            potentialSavings,
            percentReduction,
        };

        return {
            materials,
            summary,
            benchmarks,
            recommendations,
        };
    }

    // Convert CO2e to equivalents for visualization
    getEquivalents(kgCO2e: number): {
        trees: number;
        carMiles: number;
        flightHours: number;
        homeEnergy: number;
    } {
        return {
            trees: Math.round(kgCO2e / 21), // ~21 kg CO2 per tree per year
            carMiles: Math.round(kgCO2e / 0.404), // ~0.404 kg CO2 per mile
            flightHours: Math.round(kgCO2e / 90), // ~90 kg CO2 per hour of flight
            homeEnergy: Math.round(kgCO2e / 7700), // ~7700 kg CO2 per year for avg home
        };
    }

    // Get reduction tips based on materials
    getReductionTips(materials: MaterialCarbonData[]): string[] {
        const tips: string[] = [];
        const materialTypes = new Set(materials.map(m => this.detectMaterialType(m.name)));

        if (materialTypes.has('concrete')) {
            tips.push('Consider using supplementary cementitious materials (SCMs) like fly ash or slag to reduce concrete carbon footprint by up to 50%');
            tips.push('Specify concrete with carbon capture technology for additional CO2 reduction');
        }

        if (materialTypes.has('steel')) {
            tips.push('Specify recycled steel content (minimum 90% recycled) to reduce embodied carbon by up to 60%');
            tips.push('Consider electric arc furnace (EAF) steel over blast furnace steel');
        }

        if (materialTypes.has('aluminum')) {
            tips.push('Use recycled aluminum wherever possible - it uses 95% less energy than virgin aluminum');
        }

        if (materialTypes.has('lumber')) {
            tips.push('Specify FSC-certified or regionally sourced timber to ensure sustainable forestry practices');
            tips.push('Consider mass timber (CLT, GLT) as an alternative to steel and concrete for structural elements');
        }

        if (materialTypes.has('insulation')) {
            tips.push('Natural insulation materials like cellulose, hemp, or cork have significantly lower embodied carbon');
        }

        tips.push('Request Environmental Product Declarations (EPDs) from all material suppliers for accurate carbon data');
        tips.push('Design for material efficiency - optimize structural systems to reduce material quantities');
        tips.push('Plan for deconstruction and material reuse at end of building life');

        return tips;
    }
}

export const carbonCalculatorService = new CarbonCalculatorService();
