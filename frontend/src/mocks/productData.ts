// frontend/src/mocks/productData.ts

import type { MaterialType, ProductStatus } from '../types/filters';

/**
 * MockProduct interface for UI components and demos
 * This is distinct from the database Product interface in types.ts
 * which uses snake_case and Supabase schema
 */
export interface MockProduct {
    id: number;
    name: string;
    supplier: string;
    description: string;
    imageUrl: string;
    certifications: string[];
    epd: {
      gwp: number; // Global Warming Potential in kg CO2e (A1-A3)
      gwpTotal?: number; // Total GWP across all lifecycle stages
    };
    recycledContent: number; // Percentage
    price?: number;
    priceUnit?: string;
    // New fields for Buyer Exploration View
    status: ProductStatus;
    materialType?: MaterialType;
    embodiedCarbon?: number; // Alternative to epd.gwp for display
    epdPdfUrl?: string;
    vocEmissions?: 'Low' | 'Medium' | 'High';
    rValue?: number; // Thermal resistance
    thermalConductivity?: number; // W/(m·K)
    leedCredits?: string[];
    leadTime?: string;
    availability?: 'In Stock' | 'Made to Order' | 'Limited';
  }

  export const MOCK_PRODUCTS: MockProduct[] = [
    {
      id: 1,
      name: 'Warmcel Cellulose Insulation',
      supplier: 'Warmcel Ltd',
      description: 'High-performance insulation made from recycled newspaper. Excellent thermal and acoustic properties with minimal environmental impact.',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
      certifications: ['FSC', 'LEED', 'B Corp'],
      epd: { gwp: 4.2, gwpTotal: 5.8 },
      recycledContent: 85,
      price: 4500,
      priceUnit: 'per 500 sq ft',
      status: 'verified',
      materialType: 'Insulation',
      embodiedCarbon: 4.2,
      epdPdfUrl: '/epds/warmcel-epd-2024.pdf',
      vocEmissions: 'Low',
      rValue: 3.7,
      leedCredits: ['MR Credit 4.1', 'EQ Credit 4.1'],
      leadTime: '2-3 weeks',
      availability: 'In Stock'
    },
    {
      id: 2,
      name: 'GreenFiber Bamboo Flooring',
      supplier: 'GreenFiber Co',
      description: 'Durable and sustainable bamboo flooring with excellent hardness rating and natural beauty.',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      certifications: ['FSC', 'LEED'],
      epd: { gwp: 10.1, gwpTotal: 14.5 },
      recycledContent: 40,
      price: 8200,
      status: 'verified',
      materialType: 'Flooring',
      embodiedCarbon: 10.1,
      epdPdfUrl: '/epds/greenfiber-bamboo-epd.pdf',
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 6'],
      leadTime: '3-4 weeks',
      availability: 'Made to Order'
    },
    {
      id: 3,
      name: 'EcoRock Drywall',
      supplier: 'EcoRock',
      description: 'Mold-resistant drywall made with 80% recycled content. Superior moisture resistance.',
      imageUrl: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?w=400&h=300&fit=crop',
      certifications: ['C2C', 'LEED'],
      epd: { gwp: 7.5, gwpTotal: 9.2 },
      recycledContent: 80,
      price: 3000,
      status: 'verified',
      materialType: 'Cladding',
      embodiedCarbon: 7.5,
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 4.1'],
      leadTime: '1-2 weeks',
      availability: 'In Stock'
    },
    {
      id: 4,
      name: 'SolarSmart Windows',
      supplier: 'SolarSmart',
      description: 'Triple-pane windows with high energy efficiency and solar heat gain control.',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      certifications: ['Energy Star', 'LEED'],
      epd: { gwp: 25.0, gwpTotal: 32.5 },
      recycledContent: 20,
      price: 15000,
      status: 'verified',
      materialType: 'Glass',
      embodiedCarbon: 25.0,
      epdPdfUrl: '/epds/solarsmart-windows-epd.pdf',
      vocEmissions: 'Low',
      rValue: 5.0,
      thermalConductivity: 0.8,
      leedCredits: ['EA Credit 1'],
      leadTime: '4-6 weeks',
      availability: 'Made to Order'
    },
    {
      id: 5,
      name: 'BioPaint Interior Paint',
      supplier: 'BioPaint',
      description: 'Zero-VOC paint for healthy indoor air quality. Available in a wide range of colors.',
      imageUrl: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop',
      certifications: ['Green Seal'],
      epd: { gwp: 2.1 },
      recycledContent: 0,
      price: 250,
      status: 'pending',
      embodiedCarbon: 2.1,
      vocEmissions: 'Low',
      leedCredits: ['EQ Credit 4.2'],
      leadTime: '3-5 days',
      availability: 'In Stock'
    },
    {
      id: 6,
      name: 'Recycled Steel Beams',
      supplier: 'Steel Mill Inc.',
      description: 'Structural steel beams made from 90% recycled steel with full material traceability.',
      imageUrl: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400&h=300&fit=crop',
      certifications: ['LEED'],
      epd: { gwp: 150.0, gwpTotal: 185.0 },
      recycledContent: 90,
      price: 25000,
      status: 'verified',
      materialType: 'Steel',
      embodiedCarbon: 150.0,
      epdPdfUrl: '/epds/steelmill-beams-epd.pdf',
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 4.1', 'MR Credit 4.2'],
      leadTime: '6-8 weeks',
      availability: 'Made to Order'
    },
    {
      id: 7,
      name: 'EcoConcrete Mix',
      supplier: 'GreenBuild Materials',
      description: 'Low-carbon concrete mix with 30% cement replacement using industrial byproducts.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
      certifications: ['LEED', 'C2C'],
      epd: { gwp: 85.0, gwpTotal: 110.0 },
      recycledContent: 35,
      price: 12000,
      status: 'verified',
      materialType: 'Concrete',
      embodiedCarbon: 85.0,
      epdPdfUrl: '/epds/ecoconcrete-mix-epd.pdf',
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 4.1'],
      leadTime: '1-2 weeks',
      availability: 'In Stock'
    },
    {
      id: 8,
      name: 'FSC Certified Hardwood',
      supplier: 'Sustainable Timber Co',
      description: 'Premium FSC-certified hardwood lumber for structural and finishing applications.',
      imageUrl: 'https://images.unsplash.com/photo-1541123603104-512919d6a96c?w=400&h=300&fit=crop',
      certifications: ['FSC', 'LEED'],
      epd: { gwp: 12.0, gwpTotal: 18.0 },
      recycledContent: 0,
      price: 18000,
      status: 'verified',
      materialType: 'Wood',
      embodiedCarbon: 12.0,
      epdPdfUrl: '/epds/sustainable-timber-epd.pdf',
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 7'],
      leadTime: '3-4 weeks',
      availability: 'In Stock'
    },
    {
      id: 9,
      name: 'Cork Flooring Tiles',
      supplier: 'CorkNature',
      description: 'Natural cork flooring with excellent acoustic and thermal insulation properties.',
      imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
      certifications: ['FSC', 'B Corp'],
      epd: { gwp: 6.5 },
      recycledContent: 15,
      price: 5500,
      status: 'pending',
      materialType: 'Flooring',
      embodiedCarbon: 6.5,
      vocEmissions: 'Low',
      rValue: 1.125,
      leedCredits: ['MR Credit 6'],
      leadTime: '2-3 weeks',
      availability: 'Limited'
    },
    {
      id: 10,
      name: 'Rockwool Stone Fiber Insulation',
      supplier: 'Rockwool International',
      description: 'Fire-resistant stone wool insulation with excellent thermal and acoustic performance.',
      imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400&h=300&fit=crop',
      certifications: ['LEED', 'Energy Star'],
      epd: { gwp: 18.5, gwpTotal: 22.0 },
      recycledContent: 45,
      price: 6200,
      status: 'verified',
      materialType: 'Insulation',
      embodiedCarbon: 18.5,
      epdPdfUrl: '/epds/rockwool-insulation-epd.pdf',
      vocEmissions: 'Low',
      rValue: 4.3,
      thermalConductivity: 0.035,
      leedCredits: ['EA Credit 1', 'EQ Credit 4.1'],
      leadTime: '1-2 weeks',
      availability: 'In Stock'
    },
    {
      id: 11,
      name: 'Low-E Glass Panels',
      supplier: 'ClearView Glass',
      description: 'High-performance low-emissivity glass with excellent thermal insulation.',
      imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop',
      certifications: ['Energy Star', 'LEED'],
      epd: { gwp: 35.0, gwpTotal: 42.0 },
      recycledContent: 25,
      price: 22000,
      status: 'verified',
      materialType: 'Glass',
      embodiedCarbon: 35.0,
      epdPdfUrl: '/epds/clearview-loe-glass-epd.pdf',
      vocEmissions: 'Low',
      rValue: 3.5,
      thermalConductivity: 1.0,
      leedCredits: ['EA Credit 1'],
      leadTime: '3-5 weeks',
      availability: 'Made to Order'
    },
    {
      id: 12,
      name: 'Fiber Cement Cladding',
      supplier: 'DuraSide Inc',
      description: 'Weather-resistant fiber cement cladding with 50-year warranty.',
      imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
      certifications: ['C2C', 'Green Seal'],
      epd: { gwp: 28.0, gwpTotal: 35.0 },
      recycledContent: 30,
      price: 9500,
      status: 'unverified',
      materialType: 'Cladding',
      embodiedCarbon: 28.0,
      vocEmissions: 'Low',
      leedCredits: ['MR Credit 4.1'],
      leadTime: '2-4 weeks',
      availability: 'In Stock'
    },
  ];
