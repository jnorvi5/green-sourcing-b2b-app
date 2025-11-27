/**
 * Autodesk/EC3 Data Seed Script
 * 
 * Pre-populates MongoDB with material carbon data, conversion factors,
 * and benchmarks to avoid runtime API calls.
 * 
 * Run: npx tsx scripts/seed-autodesk-data.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

// Import models
import Material from '../models/Material';
import CarbonFactor from '../models/CarbonFactor';
import EPDProgram from '../models/EPDProgram';
import UnitConversion from '../models/UnitConversion';
import CarbonAlternative from '../models/CarbonAlternative';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/greenchainz';

// ============================================
// MATERIAL DATA (Based on EC3/Autodesk averages)
// ============================================
const MATERIALS_DATA = [
    // CONCRETE - MasterFormat 03
    {
        materialId: 'concrete-ready-mix-standard',
        name: 'Ready-Mix Concrete (Standard)',
        category: 'Concrete',
        subcategory: 'Ready-Mix',
        masterFormat: '03 30 00',
        gwp: 350,
        gwpUnit: 'kg CO2e/m³',
        declaredUnit: '1 m³',
        density: 2400,
        lifecycleStages: { a1a3: 350, a4: 15, a5: 5 },
        benchmarks: { percentile: 50, industryAvg: 350, bestInClass: 150, worstInClass: 500 },
        source: 'EC3 Database',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'foundation', 'common'],
    },
    {
        materialId: 'concrete-ready-mix-low-carbon',
        name: 'Ready-Mix Concrete (Low-Carbon)',
        category: 'Concrete',
        subcategory: 'Ready-Mix',
        masterFormat: '03 30 00',
        gwp: 200,
        gwpUnit: 'kg CO2e/m³',
        declaredUnit: '1 m³',
        density: 2350,
        lifecycleStages: { a1a3: 200, a4: 15, a5: 5 },
        benchmarks: { percentile: 20, industryAvg: 350, bestInClass: 150, worstInClass: 500 },
        source: 'EC3 Database',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'low-carbon', 'green'],
    },
    {
        materialId: 'concrete-precast',
        name: 'Precast Concrete',
        category: 'Concrete',
        subcategory: 'Precast',
        masterFormat: '03 40 00',
        gwp: 380,
        gwpUnit: 'kg CO2e/m³',
        declaredUnit: '1 m³',
        density: 2400,
        lifecycleStages: { a1a3: 380, a4: 20, a5: 10 },
        benchmarks: { percentile: 55, industryAvg: 380, bestInClass: 200, worstInClass: 550 },
        source: 'EC3 Database',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'prefab'],
    },

    // STEEL - MasterFormat 05
    {
        materialId: 'steel-structural-virgin',
        name: 'Structural Steel (Virgin/BF-BOF)',
        category: 'Steel',
        subcategory: 'Structural',
        masterFormat: '05 12 00',
        gwp: 2.1,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 7850,
        lifecycleStages: { a1a3: 2.1, a4: 0.05, a5: 0.02 },
        benchmarks: { percentile: 70, industryAvg: 1.8, bestInClass: 0.8, worstInClass: 2.5 },
        source: 'World Steel Association',
        dataQuality: 'high',
        region: 'Global',
        tags: ['structural', 'high-carbon'],
    },
    {
        materialId: 'steel-structural-recycled',
        name: 'Structural Steel (Recycled/EAF)',
        category: 'Steel',
        subcategory: 'Structural',
        masterFormat: '05 12 00',
        gwp: 0.8,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 7850,
        lifecycleStages: { a1a3: 0.8, a4: 0.05, a5: 0.02, d: -0.3 },
        benchmarks: { percentile: 15, industryAvg: 1.8, bestInClass: 0.5, worstInClass: 2.5 },
        source: 'World Steel Association',
        dataQuality: 'high',
        region: 'Global',
        tags: ['structural', 'recycled', 'low-carbon', 'EAF'],
    },
    {
        materialId: 'steel-rebar',
        name: 'Reinforcing Steel (Rebar)',
        category: 'Steel',
        subcategory: 'Reinforcing',
        masterFormat: '03 20 00',
        gwp: 1.2,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 7850,
        lifecycleStages: { a1a3: 1.2, a4: 0.03 },
        benchmarks: { percentile: 40, industryAvg: 1.3, bestInClass: 0.6, worstInClass: 2.0 },
        source: 'EC3 Database',
        dataQuality: 'high',
        region: 'North America',
        tags: ['reinforcing', 'rebar'],
    },

    // WOOD - MasterFormat 06
    {
        materialId: 'wood-lumber-softwood',
        name: 'Softwood Lumber (Dimensional)',
        category: 'Wood',
        subcategory: 'Lumber',
        masterFormat: '06 10 00',
        gwp: 0.35,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 500,
        lifecycleStages: { a1a3: 0.35, a4: 0.05, d: -1.2 },
        benchmarks: { percentile: 25, industryAvg: 0.4, bestInClass: 0.2, worstInClass: 0.8 },
        source: 'AWC EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'renewable', 'carbon-sequestering'],
    },
    {
        materialId: 'wood-clt',
        name: 'Cross-Laminated Timber (CLT)',
        category: 'Wood',
        subcategory: 'Mass Timber',
        masterFormat: '06 17 00',
        gwp: 0.45,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 480,
        lifecycleStages: { a1a3: 0.45, a4: 0.08, d: -1.1 },
        benchmarks: { percentile: 30, industryAvg: 0.5, bestInClass: 0.3, worstInClass: 0.9 },
        source: 'CLT Manufacturer EPDs',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'mass-timber', 'renewable', 'carbon-sequestering'],
    },
    {
        materialId: 'wood-glulam',
        name: 'Glued Laminated Timber (Glulam)',
        category: 'Wood',
        subcategory: 'Mass Timber',
        masterFormat: '06 18 00',
        gwp: 0.42,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 490,
        lifecycleStages: { a1a3: 0.42, a4: 0.06, d: -1.15 },
        benchmarks: { percentile: 28, industryAvg: 0.48, bestInClass: 0.28, worstInClass: 0.85 },
        source: 'Glulam Manufacturer EPDs',
        dataQuality: 'high',
        region: 'North America',
        tags: ['structural', 'mass-timber', 'renewable'],
    },

    // INSULATION - MasterFormat 07
    {
        materialId: 'insulation-mineral-wool',
        name: 'Mineral Wool Insulation',
        category: 'Insulation',
        subcategory: 'Mineral Wool',
        masterFormat: '07 21 00',
        gwp: 1.2,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 100,
        lifecycleStages: { a1a3: 1.2, a4: 0.02 },
        benchmarks: { percentile: 45, industryAvg: 1.4, bestInClass: 0.8, worstInClass: 2.5 },
        source: 'NAIMA EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['thermal', 'fire-resistant'],
    },
    {
        materialId: 'insulation-cellulose',
        name: 'Cellulose Insulation (Recycled)',
        category: 'Insulation',
        subcategory: 'Cellulose',
        masterFormat: '07 21 00',
        gwp: 0.3,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 45,
        lifecycleStages: { a1a3: 0.3, a4: 0.02, d: -0.1 },
        benchmarks: { percentile: 10, industryAvg: 1.4, bestInClass: 0.2, worstInClass: 2.5 },
        source: 'CIMA EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['thermal', 'recycled', 'low-carbon'],
    },
    {
        materialId: 'insulation-xps',
        name: 'XPS Foam Insulation',
        category: 'Insulation',
        subcategory: 'Foam Board',
        masterFormat: '07 21 00',
        gwp: 8.5,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 35,
        lifecycleStages: { a1a3: 8.5, a4: 0.01 },
        benchmarks: { percentile: 90, industryAvg: 1.4, bestInClass: 0.8, worstInClass: 12 },
        source: 'XPS Manufacturer EPDs',
        dataQuality: 'high',
        region: 'North America',
        tags: ['thermal', 'high-carbon', 'high-R-value'],
    },
    {
        materialId: 'insulation-eps',
        name: 'EPS Foam Insulation',
        category: 'Insulation',
        subcategory: 'Foam Board',
        masterFormat: '07 21 00',
        gwp: 3.5,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 25,
        lifecycleStages: { a1a3: 3.5, a4: 0.01 },
        benchmarks: { percentile: 70, industryAvg: 1.4, bestInClass: 0.8, worstInClass: 12 },
        source: 'EPS Manufacturer EPDs',
        dataQuality: 'medium',
        region: 'North America',
        tags: ['thermal', 'foam'],
    },

    // GLASS - MasterFormat 08
    {
        materialId: 'glass-float-clear',
        name: 'Float Glass (Clear)',
        category: 'Glass',
        subcategory: 'Float Glass',
        masterFormat: '08 81 00',
        gwp: 1.3,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 2500,
        lifecycleStages: { a1a3: 1.3, a4: 0.05 },
        benchmarks: { percentile: 50, industryAvg: 1.3, bestInClass: 0.9, worstInClass: 1.8 },
        source: 'Glass Industry EPDs',
        dataQuality: 'high',
        region: 'Global',
        tags: ['glazing', 'transparent'],
    },
    {
        materialId: 'glass-low-e',
        name: 'Low-E Coated Glass',
        category: 'Glass',
        subcategory: 'Coated Glass',
        masterFormat: '08 81 00',
        gwp: 1.5,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 2500,
        lifecycleStages: { a1a3: 1.5, a4: 0.05 },
        benchmarks: { percentile: 55, industryAvg: 1.5, bestInClass: 1.0, worstInClass: 2.2 },
        source: 'Glass Industry EPDs',
        dataQuality: 'high',
        region: 'Global',
        tags: ['glazing', 'energy-efficient', 'low-e'],
    },

    // ALUMINUM - MasterFormat 05
    {
        materialId: 'aluminum-virgin',
        name: 'Aluminum (Primary/Virgin)',
        category: 'Aluminum',
        subcategory: 'Primary',
        masterFormat: '05 21 00',
        gwp: 16.5,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 2700,
        lifecycleStages: { a1a3: 16.5, a4: 0.1 },
        benchmarks: { percentile: 85, industryAvg: 12, bestInClass: 4, worstInClass: 20 },
        source: 'International Aluminium Institute',
        dataQuality: 'high',
        region: 'Global',
        tags: ['high-carbon', 'curtain-wall'],
    },
    {
        materialId: 'aluminum-recycled',
        name: 'Aluminum (Recycled)',
        category: 'Aluminum',
        subcategory: 'Secondary',
        masterFormat: '05 21 00',
        gwp: 2.5,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 2700,
        lifecycleStages: { a1a3: 2.5, a4: 0.1, d: -5 },
        benchmarks: { percentile: 15, industryAvg: 12, bestInClass: 1.5, worstInClass: 20 },
        source: 'International Aluminium Institute',
        dataQuality: 'high',
        region: 'Global',
        tags: ['recycled', 'low-carbon', 'curtain-wall'],
    },

    // GYPSUM - MasterFormat 09
    {
        materialId: 'gypsum-board-standard',
        name: 'Gypsum Board (Standard)',
        category: 'Gypsum',
        subcategory: 'Wallboard',
        masterFormat: '09 29 00',
        gwp: 0.25,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 700,
        lifecycleStages: { a1a3: 0.25, a4: 0.02 },
        benchmarks: { percentile: 50, industryAvg: 0.25, bestInClass: 0.15, worstInClass: 0.4 },
        source: 'Gypsum Association EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['interior', 'drywall'],
    },

    // CARPET - MasterFormat 09
    {
        materialId: 'carpet-nylon',
        name: 'Nylon Carpet Tile',
        category: 'Flooring',
        subcategory: 'Carpet',
        masterFormat: '09 68 00',
        gwp: 12,
        gwpUnit: 'kg CO2e/m²',
        declaredUnit: '1 m²',
        lifecycleStages: { a1a3: 12, a4: 0.5, d: -2 },
        benchmarks: { percentile: 60, industryAvg: 14, bestInClass: 5, worstInClass: 25 },
        source: 'Carpet Industry EPDs',
        dataQuality: 'high',
        region: 'North America',
        tags: ['interior', 'flooring'],
    },

    // CEMENT - MasterFormat 03
    {
        materialId: 'cement-portland-type1',
        name: 'Portland Cement (Type I)',
        category: 'Cement',
        subcategory: 'Portland',
        masterFormat: '03 05 00',
        gwp: 0.9,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 1500,
        lifecycleStages: { a1a3: 0.9 },
        benchmarks: { percentile: 60, industryAvg: 0.85, bestInClass: 0.6, worstInClass: 1.1 },
        source: 'PCA EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['binder', 'portland'],
    },
    {
        materialId: 'cement-blended-scm',
        name: 'Blended Cement (with SCMs)',
        category: 'Cement',
        subcategory: 'Blended',
        masterFormat: '03 05 00',
        gwp: 0.6,
        gwpUnit: 'kg CO2e/kg',
        declaredUnit: '1 kg',
        density: 1500,
        lifecycleStages: { a1a3: 0.6 },
        benchmarks: { percentile: 25, industryAvg: 0.85, bestInClass: 0.4, worstInClass: 1.1 },
        source: 'PCA EPD',
        dataQuality: 'high',
        region: 'North America',
        tags: ['binder', 'low-carbon', 'scm'],
    },
];

// ============================================
// CARBON FACTORS DATA
// ============================================
const CARBON_FACTORS_DATA = [
    // US Grid Electricity by Region
    { factorId: 'elec-us-national', type: 'electricity', region: 'North America', country: 'US', factor: 0.417, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-us-northeast', type: 'electricity', region: 'North America', country: 'US', subregion: 'NPCC', factor: 0.254, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-us-california', type: 'electricity', region: 'North America', country: 'US', subregion: 'CAMX', factor: 0.226, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-us-midwest', type: 'electricity', region: 'North America', country: 'US', subregion: 'MROW', factor: 0.489, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-us-texas', type: 'electricity', region: 'North America', country: 'US', subregion: 'ERCT', factor: 0.396, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-us-southeast', type: 'electricity', region: 'North America', country: 'US', subregion: 'SRSO', factor: 0.434, unit: 'kg CO2e/kWh', source: 'EPA eGRID 2022', year: 2022, validFrom: new Date('2022-01-01') },

    // Canada
    { factorId: 'elec-ca-national', type: 'electricity', region: 'North America', country: 'CA', factor: 0.120, unit: 'kg CO2e/kWh', source: 'Environment Canada', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-ca-ontario', type: 'electricity', region: 'North America', country: 'CA', subregion: 'ON', factor: 0.030, unit: 'kg CO2e/kWh', source: 'Environment Canada', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-ca-alberta', type: 'electricity', region: 'North America', country: 'CA', subregion: 'AB', factor: 0.540, unit: 'kg CO2e/kWh', source: 'Environment Canada', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-ca-quebec', type: 'electricity', region: 'North America', country: 'CA', subregion: 'QC', factor: 0.002, unit: 'kg CO2e/kWh', source: 'Environment Canada', year: 2022, validFrom: new Date('2022-01-01') },

    // Europe
    { factorId: 'elec-eu-average', type: 'electricity', region: 'Europe', country: 'EU', factor: 0.295, unit: 'kg CO2e/kWh', source: 'EEA', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-de', type: 'electricity', region: 'Europe', country: 'DE', factor: 0.366, unit: 'kg CO2e/kWh', source: 'UBA Germany', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-fr', type: 'electricity', region: 'Europe', country: 'FR', factor: 0.052, unit: 'kg CO2e/kWh', source: 'ADEME', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-gb', type: 'electricity', region: 'Europe', country: 'GB', factor: 0.193, unit: 'kg CO2e/kWh', source: 'DEFRA', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-se', type: 'electricity', region: 'Europe', country: 'SE', factor: 0.008, unit: 'kg CO2e/kWh', source: 'IEA', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-no', type: 'electricity', region: 'Europe', country: 'NO', factor: 0.017, unit: 'kg CO2e/kWh', source: 'IEA', year: 2022, validFrom: new Date('2022-01-01') },

    // Asia Pacific
    { factorId: 'elec-au', type: 'electricity', region: 'Asia Pacific', country: 'AU', factor: 0.680, unit: 'kg CO2e/kWh', source: 'Australian Government', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-jp', type: 'electricity', region: 'Asia Pacific', country: 'JP', factor: 0.470, unit: 'kg CO2e/kWh', source: 'IEA', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-cn', type: 'electricity', region: 'Asia Pacific', country: 'CN', factor: 0.581, unit: 'kg CO2e/kWh', source: 'IEA', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'elec-in', type: 'electricity', region: 'Asia Pacific', country: 'IN', factor: 0.708, unit: 'kg CO2e/kWh', source: 'CEA India', year: 2022, validFrom: new Date('2022-01-01') },

    // Transport
    { factorId: 'transport-truck', type: 'transport', region: 'Global', country: 'GLOBAL', factor: 0.105, unit: 'kg CO2e/ton-km', source: 'GLEC Framework', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'transport-rail', type: 'transport', region: 'Global', country: 'GLOBAL', factor: 0.028, unit: 'kg CO2e/ton-km', source: 'GLEC Framework', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'transport-ship', type: 'transport', region: 'Global', country: 'GLOBAL', factor: 0.016, unit: 'kg CO2e/ton-km', source: 'IMO', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'transport-air', type: 'transport', region: 'Global', country: 'GLOBAL', factor: 1.1, unit: 'kg CO2e/ton-km', source: 'ICAO', year: 2022, validFrom: new Date('2022-01-01') },

    // Fuels
    { factorId: 'fuel-diesel', type: 'fuel', region: 'Global', country: 'GLOBAL', factor: 2.68, unit: 'kg CO2e/liter', source: 'IPCC', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'fuel-natural-gas', type: 'fuel', region: 'Global', country: 'GLOBAL', factor: 2.0, unit: 'kg CO2e/m³', source: 'IPCC', year: 2022, validFrom: new Date('2022-01-01') },
    { factorId: 'fuel-lpg', type: 'fuel', region: 'Global', country: 'GLOBAL', factor: 1.51, unit: 'kg CO2e/liter', source: 'IPCC', year: 2022, validFrom: new Date('2022-01-01') },
];

// ============================================
// EPD PROGRAM OPERATORS
// ============================================
const EPD_PROGRAMS_DATA = [
    {
        programId: 'environdec',
        name: 'The International EPD System',
        shortName: 'EPD International',
        website: 'https://www.environdec.com',
        registryUrl: 'https://www.environdec.com/library',
        regions: ['Global'],
        headquarters: 'SE',
        epdPrefix: 'S-P-',
        standards: ['ISO 14025', 'EN 15804', 'ISO 21930'],
        pcrCategories: ['Construction Products', 'Building Materials'],
        isActive: true,
        accreditedBy: ['Swedac'],
    },
    {
        programId: 'ul-environment',
        name: 'UL Environment',
        shortName: 'UL',
        website: 'https://www.ul.com/resources/ul-epd-program',
        registryUrl: 'https://spot.ul.com/main/search',
        regions: ['North America', 'Global'],
        headquarters: 'US',
        epdPrefix: 'UL-EPD-',
        standards: ['ISO 14025', 'ISO 21930'],
        pcrCategories: ['Building Products', 'Construction Materials'],
        isActive: true,
        accreditedBy: ['ANAB'],
    },
    {
        programId: 'icc-es',
        name: 'ICC Evaluation Service',
        shortName: 'ICC-ES',
        website: 'https://icc-es.org/epd-program/',
        registryUrl: 'https://icc-es.org/epd-program/epd-library/',
        regions: ['North America'],
        headquarters: 'US',
        epdPrefix: 'EPD-',
        standards: ['ISO 14025', 'ISO 21930'],
        pcrCategories: ['Construction Products'],
        isActive: true,
        accreditedBy: ['ANAB'],
    },
    {
        programId: 'nsf',
        name: 'NSF International',
        shortName: 'NSF',
        website: 'https://www.nsf.org/knowledge-library/epd-environmental-product-declarations',
        regions: ['North America', 'Global'],
        headquarters: 'US',
        standards: ['ISO 14025'],
        pcrCategories: ['Construction', 'Building Materials'],
        isActive: true,
        accreditedBy: ['ANAB'],
    },
    {
        programId: 'ibuepdprograme',
        name: 'Institut Bauen und Umwelt',
        shortName: 'IBU',
        website: 'https://ibu-epd.com',
        registryUrl: 'https://ibu-epd.com/published-epds/',
        regions: ['Europe', 'Global'],
        headquarters: 'DE',
        epdPrefix: 'EPD-',
        standards: ['ISO 14025', 'EN 15804'],
        pcrCategories: ['Construction Products'],
        isActive: true,
        accreditedBy: ['DAkkS'],
    },
    {
        programId: 'bre',
        name: 'BRE Global',
        shortName: 'BRE',
        website: 'https://www.bregroup.com/products/environmental-product-declarations/',
        regions: ['Europe', 'UK'],
        headquarters: 'GB',
        standards: ['ISO 14025', 'EN 15804'],
        pcrCategories: ['Construction Products'],
        isActive: true,
    },
    {
        programId: 'inies',
        name: 'INIES Database',
        shortName: 'INIES',
        website: 'https://www.inies.fr',
        regions: ['Europe', 'France'],
        headquarters: 'FR',
        standards: ['ISO 14025', 'EN 15804', 'NF EN 15804'],
        pcrCategories: ['Construction Products'],
        isActive: true,
    },
    {
        programId: 'astm',
        name: 'ASTM International EPD Program',
        shortName: 'ASTM',
        website: 'https://www.astm.org/CERTIFICATION/EpdAndPcrListing.html',
        regions: ['North America', 'Global'],
        headquarters: 'US',
        standards: ['ISO 14025', 'ISO 21930'],
        pcrCategories: ['Construction', 'Building Materials'],
        isActive: true,
        accreditedBy: ['ANAB'],
    },
];

// ============================================
// UNIT CONVERSIONS
// ============================================
const UNIT_CONVERSIONS_DATA = [
    {
        materialCategory: 'Concrete',
        materialType: 'Ready-mix',
        density: 2400,
        densityRange: { min: 2200, max: 2500 },
        conversions: [
            { fromUnit: 'm³', toUnit: 'kg', factor: 2400, notes: 'Standard density' },
            { fromUnit: 'm³', toUnit: 'yd³', factor: 1.308, notes: 'Volume conversion' },
            { fromUnit: 'yd³', toUnit: 'kg', factor: 1835, notes: 'US unit to mass' },
        ],
        source: 'ACI 318',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Steel',
        materialType: 'Structural',
        density: 7850,
        conversions: [
            { fromUnit: 'ton', toUnit: 'kg', factor: 1000, notes: 'Metric ton' },
            { fromUnit: 'short ton', toUnit: 'kg', factor: 907.2, notes: 'US short ton' },
            { fromUnit: 'm³', toUnit: 'kg', factor: 7850, notes: 'Volume to mass' },
        ],
        source: 'AISC',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Wood',
        materialType: 'Softwood Lumber',
        density: 500,
        densityRange: { min: 400, max: 600 },
        conversions: [
            { fromUnit: 'm³', toUnit: 'kg', factor: 500, notes: 'Average softwood' },
            { fromUnit: 'board foot', toUnit: 'm³', factor: 0.00236, notes: 'BF to metric' },
            { fromUnit: 'MBF', toUnit: 'm³', factor: 2.36, notes: 'Thousand board feet' },
        ],
        source: 'AWC',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Wood',
        materialType: 'CLT',
        density: 480,
        conversions: [
            { fromUnit: 'm³', toUnit: 'kg', factor: 480 },
            { fromUnit: 'm²', toUnit: 'm³', factor: 0.175, notes: 'Typical 175mm panel' },
        ],
        source: 'CLT Handbook',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Insulation',
        materialType: 'Mineral Wool',
        density: 100,
        densityRange: { min: 30, max: 200 },
        conversions: [
            { fromUnit: 'm³', toUnit: 'kg', factor: 100, notes: 'Medium density batt' },
            { fromUnit: 'm²', toUnit: 'kg', factor: 10, notes: 'At 100mm thickness' },
        ],
        source: 'NAIMA',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Glass',
        materialType: 'Float Glass',
        density: 2500,
        conversions: [
            { fromUnit: 'm²', toUnit: 'kg', factor: 25, notes: '10mm thickness' },
            { fromUnit: 'm²', toUnit: 'kg', factor: 15, notes: '6mm thickness' },
        ],
        source: 'Glass Industry',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Aluminum',
        density: 2700,
        conversions: [
            { fromUnit: 'm³', toUnit: 'kg', factor: 2700 },
            { fromUnit: 'm²', toUnit: 'kg', factor: 2.7, notes: '1mm sheet' },
        ],
        source: 'Aluminum Association',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Gypsum',
        materialType: 'Wallboard',
        density: 700,
        conversions: [
            { fromUnit: 'm²', toUnit: 'kg', factor: 8.8, notes: '12.7mm (1/2") board' },
            { fromUnit: 'sheet', toUnit: 'm²', factor: 2.97, notes: '4x8 ft sheet' },
        ],
        source: 'Gypsum Association',
        dataQuality: 'high',
    },
    {
        materialCategory: 'Cement',
        density: 1500,
        conversions: [
            { fromUnit: 'bag', toUnit: 'kg', factor: 42.6, notes: 'US 94lb bag' },
            { fromUnit: 'bag', toUnit: 'kg', factor: 50, notes: 'Metric bag' },
        ],
        source: 'PCA',
        dataQuality: 'high',
    },
];

// ============================================
// CARBON ALTERNATIVES (Swap Recommendations)
// ============================================
const CARBON_ALTERNATIVES_DATA = [
    {
        originalMaterial: {
            category: 'Concrete',
            name: 'Standard Ready-Mix Concrete',
            gwp: 350,
            unit: 'kg CO2e/m³',
        },
        alternatives: [
            {
                name: 'Low-Carbon Ready-Mix (30% SCM)',
                category: 'Concrete',
                gwp: 250,
                unit: 'kg CO2e/m³',
                reduction: 29,
                reductionAbsolute: 100,
                compatibility: 'drop-in',
                considerations: ['May have slower early strength gain', 'Verify with structural engineer for critical applications'],
                costImpact: 'similar',
                availability: 'widely-available',
            },
            {
                name: 'Ultra-Low Carbon Concrete (50% SCM)',
                category: 'Concrete',
                gwp: 175,
                unit: 'kg CO2e/m³',
                reduction: 50,
                reductionAbsolute: 175,
                compatibility: 'similar',
                considerations: ['Extended curing time', 'May not meet all strength requirements', 'Best for non-structural applications'],
                costImpact: 'similar',
                availability: 'limited',
            },
            {
                name: 'Carbon-Cured Concrete',
                category: 'Concrete',
                gwp: 280,
                unit: 'kg CO2e/m³',
                reduction: 20,
                reductionAbsolute: 70,
                compatibility: 'similar',
                considerations: ['CO2 injected during curing', 'Can improve strength', 'Limited precast availability'],
                costImpact: 'higher',
                availability: 'emerging',
            },
        ],
        applications: ['Structural', 'Non-structural', 'Foundation'],
        dataQuality: 'verified',
    },
    {
        originalMaterial: {
            category: 'Steel',
            name: 'Virgin Structural Steel (BF-BOF)',
            gwp: 2.1,
            unit: 'kg CO2e/kg',
        },
        alternatives: [
            {
                name: 'Recycled Steel (EAF)',
                category: 'Steel',
                gwp: 0.8,
                unit: 'kg CO2e/kg',
                reduction: 62,
                reductionAbsolute: 1.3,
                compatibility: 'drop-in',
                considerations: ['Same structural properties', 'Verify mill certificate', 'May have limited section sizes'],
                costImpact: 'similar',
                availability: 'widely-available',
                regions: ['North America', 'Europe'],
            },
            {
                name: 'Green Steel (H2-DRI)',
                category: 'Steel',
                gwp: 0.4,
                unit: 'kg CO2e/kg',
                reduction: 81,
                reductionAbsolute: 1.7,
                compatibility: 'drop-in',
                considerations: ['Premium product', 'Limited availability', 'May require advance ordering'],
                costImpact: 'much-higher',
                costMultiplier: 1.3,
                availability: 'emerging',
                regions: ['Europe', 'Sweden'],
            },
        ],
        applications: ['Structural', 'Framing'],
        dataQuality: 'verified',
    },
    {
        originalMaterial: {
            category: 'Steel',
            name: 'Steel Framing',
            gwp: 1.5,
            unit: 'kg CO2e/kg',
        },
        alternatives: [
            {
                name: 'Mass Timber (CLT)',
                category: 'Wood',
                gwp: 0.45,
                unit: 'kg CO2e/kg',
                reduction: 70,
                reductionAbsolute: 1.05,
                compatibility: 'requires-redesign',
                considerations: ['Different structural system', 'Fire protection requirements', 'Moisture protection critical', 'May store carbon'],
                costImpact: 'higher',
                costMultiplier: 1.15,
                availability: 'widely-available',
                performanceNotes: 'Can achieve similar structural performance with proper design',
            },
            {
                name: 'Glulam Beams',
                category: 'Wood',
                gwp: 0.42,
                unit: 'kg CO2e/kg',
                reduction: 72,
                reductionAbsolute: 1.08,
                compatibility: 'requires-redesign',
                considerations: ['Good for long spans', 'Fire-resistant with mass', 'Aesthetic appeal'],
                costImpact: 'similar',
                availability: 'widely-available',
            },
        ],
        applications: ['Structural', 'Framing', 'Mid-rise Buildings'],
        dataQuality: 'verified',
    },
    {
        originalMaterial: {
            category: 'Insulation',
            name: 'XPS Foam Board',
            gwp: 8.5,
            unit: 'kg CO2e/kg',
        },
        alternatives: [
            {
                name: 'Mineral Wool',
                category: 'Insulation',
                gwp: 1.2,
                unit: 'kg CO2e/kg',
                reduction: 86,
                reductionAbsolute: 7.3,
                compatibility: 'similar',
                considerations: ['Different R-value per inch', 'May need thicker application', 'Fire resistant'],
                costImpact: 'similar',
                availability: 'widely-available',
            },
            {
                name: 'Cellulose (Recycled)',
                category: 'Insulation',
                gwp: 0.3,
                unit: 'kg CO2e/kg',
                reduction: 96,
                reductionAbsolute: 8.2,
                compatibility: 'similar',
                considerations: ['Blown-in application', 'Good for retrofit', 'Recycled content'],
                costImpact: 'lower',
                availability: 'widely-available',
            },
            {
                name: 'EPS Foam (Lower GWP Blowing Agent)',
                category: 'Insulation',
                gwp: 3.5,
                unit: 'kg CO2e/kg',
                reduction: 59,
                reductionAbsolute: 5.0,
                compatibility: 'drop-in',
                considerations: ['Similar performance to XPS', 'Lower compressive strength'],
                costImpact: 'lower',
                availability: 'widely-available',
            },
        ],
        applications: ['Thermal', 'Below-grade', 'Roof'],
        dataQuality: 'verified',
    },
    {
        originalMaterial: {
            category: 'Aluminum',
            name: 'Primary Aluminum',
            gwp: 16.5,
            unit: 'kg CO2e/kg',
        },
        alternatives: [
            {
                name: 'Recycled Aluminum',
                category: 'Aluminum',
                gwp: 2.5,
                unit: 'kg CO2e/kg',
                reduction: 85,
                reductionAbsolute: 14,
                compatibility: 'drop-in',
                considerations: ['Same performance', 'Verify recycled content certification', 'Wide availability'],
                costImpact: 'similar',
                availability: 'widely-available',
            },
            {
                name: 'Low-Carbon Primary (Hydro-powered)',
                category: 'Aluminum',
                gwp: 4.0,
                unit: 'kg CO2e/kg',
                reduction: 76,
                reductionAbsolute: 12.5,
                compatibility: 'drop-in',
                considerations: ['From regions with clean grid', 'Iceland, Norway, Quebec production'],
                costImpact: 'higher',
                availability: 'limited',
                regions: ['Europe', 'Canada'],
            },
        ],
        applications: ['Curtain Wall', 'Windows', 'Framing'],
        dataQuality: 'verified',
    },
];

// ============================================
// SEED FUNCTION
// ============================================
async function seedAutodeskData() {
    console.log('🌱 Starting Autodesk/EC3 Data Seed...\n');

    try {
        // Connect to MongoDB
        console.log('📦 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Seed Materials
        console.log('🧱 Seeding Materials...');
        await Material.deleteMany({});
        const materials = await Material.insertMany(MATERIALS_DATA);
        console.log(`   ✅ Inserted ${materials.length} materials\n`);

        // Seed Carbon Factors
        console.log('⚡ Seeding Carbon Factors...');
        await CarbonFactor.deleteMany({});
        const factors = await CarbonFactor.insertMany(CARBON_FACTORS_DATA);
        console.log(`   ✅ Inserted ${factors.length} carbon factors\n`);

        // Seed EPD Programs
        console.log('📋 Seeding EPD Programs...');
        await EPDProgram.deleteMany({});
        const programs = await EPDProgram.insertMany(EPD_PROGRAMS_DATA);
        console.log(`   ✅ Inserted ${programs.length} EPD programs\n`);

        // Seed Unit Conversions
        console.log('📐 Seeding Unit Conversions...');
        await UnitConversion.deleteMany({});
        const conversions = await UnitConversion.insertMany(UNIT_CONVERSIONS_DATA);
        console.log(`   ✅ Inserted ${conversions.length} unit conversions\n`);

        // Seed Carbon Alternatives
        console.log('♻️ Seeding Carbon Alternatives...');
        await CarbonAlternative.deleteMany({});
        const alternatives = await CarbonAlternative.insertMany(CARBON_ALTERNATIVES_DATA);
        console.log(`   ✅ Inserted ${alternatives.length} carbon alternative recommendations\n`);

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('🎉 SEED COMPLETE!');
        console.log('═══════════════════════════════════════');
        console.log(`   Materials:          ${materials.length}`);
        console.log(`   Carbon Factors:     ${factors.length}`);
        console.log(`   EPD Programs:       ${programs.length}`);
        console.log(`   Unit Conversions:   ${conversions.length}`);
        console.log(`   Carbon Alternatives: ${alternatives.length}`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Seed Error:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('📦 Disconnected from MongoDB');
    }
}

// Run the seed
seedAutodeskData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
