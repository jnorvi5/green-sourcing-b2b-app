/**
 * Autodesk Platform Services (APS) Integration
 * 
 * Uses REST API for authentication and data access.
 * NOW USES CACHED MongoDB DATA for carbon lookups to minimize API calls.
 * 
 * Supports:
 * - 2-legged OAuth for server-to-server auth
 * - Model Derivative API for 3D viewer
 * - Cached carbon data from MongoDB (materials, factors, alternatives)
 */
import mongoose from 'mongoose';

const CLIENT_ID = process.env.AUTODESK_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTODESK_CLIENT_SECRET!;
const AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token';
const MONGODB_URI = process.env.MONGODB_URI || '';

// Token cache
let cachedToken: { access_token: string; expires_at: number } | null = null;

// MongoDB connection helper
async function connectDB() {
  if (mongoose.connection.readyState === 0 && MONGODB_URI) {
    await mongoose.connect(MONGODB_URI);
  }
}

export async function getAutodeskToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (cachedToken && cachedToken.expires_at > Date.now() + 300000) {
      return cachedToken.access_token;
    }

    try {
      const response = await fetch(AUTH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'data:read viewables:read',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Auth failed: ${response.status} - ${error}`);
      }

      const data = await response.json();

      // Cache the token
      cachedToken = {
        access_token: data.access_token,
        expires_at: Date.now() + (data.expires_in * 1000),
      };

      return data.access_token;
    } catch (error) {
      console.error('Autodesk Auth Error:', error);
      throw new Error('Failed to authenticate with Autodesk APS');
    }
  }

/**
 * Get Embodied Carbon (GWP) for a material
 * 
 * UPDATED: Now uses cached MongoDB data first!
 * Falls back to mock data only if material not found in cache.
 */
export async function getEmbodiedCarbon(
  materialId: string,
  options?: { category?: string; name?: string }
) {
  try {
    // Try MongoDB cache first
    if (MONGODB_URI) {
      try {
        await connectDB();
        const Material = mongoose.models.Material ||
        // @ts-ignore
          (await import('../models/Material')).default;

        // Search by various IDs
        const cachedMaterial = await Material.findOne({
          $or: [
            { materialId },
            { epdId: materialId },
            { ec3Id: materialId },
            { autodeskId: materialId },
          ],
          isActive: true,
        }).lean();

        if (cachedMaterial) {
          return {
            id: cachedMaterial.materialId,
            name: cachedMaterial.name,
            category: cachedMaterial.category,
            gwp: cachedMaterial.gwp,
            gwpUnit: cachedMaterial.gwpUnit,
            declaredUnit: cachedMaterial.declaredUnit,
            lifecycleStages: cachedMaterial.lifecycleStages || { a1a3: cachedMaterial.gwp },
            benchmarks: cachedMaterial.benchmarks,
            source: cachedMaterial.source,
            methodology: 'EN 15804',
            scope: ['A1-A3'],
            cached: true,
            last_updated: cachedMaterial.updatedAt || cachedMaterial.createdAt,
          };
        }

        // Try category/name search if direct ID not found
        if (options?.category || options?.name) {
          const searchQuery: Record<string, unknown> = { isActive: true };
          if (options.category) {
            searchQuery.category = { $regex: options.category, $options: 'i' };
          }
          if (options.name) {
            searchQuery.$or = [
              { name: { $regex: options.name, $options: 'i' } },
              { tags: { $in: [options.name.toLowerCase()] } },
            ];
          }

          const matchedMaterial = await Material.findOne(searchQuery).lean();

          if (matchedMaterial) {
            return {
              id: matchedMaterial.materialId,
              name: matchedMaterial.name,
              category: matchedMaterial.category,
              gwp: matchedMaterial.gwp,
              gwpUnit: matchedMaterial.gwpUnit,
              declaredUnit: matchedMaterial.declaredUnit,
              lifecycleStages: matchedMaterial.lifecycleStages || { a1a3: matchedMaterial.gwp },
              benchmarks: matchedMaterial.benchmarks,
              source: `${matchedMaterial.source} (category match)`,
              methodology: 'EN 15804',
              scope: ['A1-A3'],
              cached: true,
              matchType: 'category',
              last_updated: matchedMaterial.updatedAt || matchedMaterial.createdAt,
            };
          }
        }

      } catch (dbError) {
        console.warn('MongoDB cache lookup failed, falling back:', dbError);
      }
    }

    // Fallback: Return mock data (for materials not in cache)
    const token = await getAutodeskToken();

    // TODO: Call real Sustainability API when available
    // const response = await fetch(
    //   `https://developer.api.autodesk.com/sustainability/v1/materials/${materialId}`,
    //   { headers: { 'Authorization': `Bearer ${token}` } }
    // );

    // For MVP, return structured mock data
    return {
      id: materialId,
      gwp: Math.random() * 10 + 2, // kgCO2e per unit
      source: 'Autodesk APS (mock)',
      methodology: 'EN 15804',
      scope: ['A1-A3'], // Cradle to gate
      cached: false,
    };
  } catch (error) {
    console.error('Embodied Carbon Error:', error);
    return null;
  }
  }

/**
 * Translate a model file to SVF2 format for viewing
 * 
 * @param urn - Base64-encoded URN of the source file
 * @returns Job info with URN for viewer
 */
export async function translateModel(urn: string): Promise<{ urn: string; status: string }> {
    const token = await getAutodeskToken();

    const response = await fetch(
      'https://developer.api.autodesk.com/modelderivative/v2/designdata/job',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-ads-force': 'true',
        },
        body: JSON.stringify({
          input: { urn },
          output: {
            formats: [{ type: 'svf2', views: ['2d', '3d'] }],
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Translation failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      urn: data.urn,
      status: data.result,
    };
  }

  /**
   * Check translation status
   */
  export async function getTranslationStatus(urn: string): Promise<{ status: string; progress: string }> {
    const token = await getAutodeskToken();

    const response = await fetch(
      `https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    const data = await response.json();
    return {
      status: data.status,
      progress: data.progress || '0%',
    };
  }

  // ============================================
  // ADDITIONAL CACHED DATA HELPERS
  // ============================================

  /**
   * Get carbon emission factor from cached data
   */
  export async function getCarbonFactor(
    type: 'electricity' | 'transport' | 'fuel',
    options: { country?: string; region?: string; subregion?: string; mode?: string }
  ) {
    if (!MONGODB_URI) return null;

    try {
      await connectDB();
      const CarbonFactor = mongoose.models.CarbonFactor ||
        // @ts-ignore
        (await import('../models/CarbonFactor')).default;

      const query: Record<string, unknown> = { type, isActive: true };

      if (type === 'transport' && options.mode) {
        query.factorId = `transport-${options.mode.toLowerCase()}`;
      } else {
        if (options.subregion) query.subregion = options.subregion.toUpperCase();
        if (options.country) query.country = options.country.toUpperCase();
        if (options.region) query.region = { $regex: options.region, $options: 'i' };
      }

      const factor = await CarbonFactor.findOne(query).lean();
      return factor;
    } catch (error) {
      console.error('getCarbonFactor error:', error);
      return null;
    }
  }

  /**
   * Get low-carbon alternatives from cached data
   */
  export async function getLowCarbonAlternatives(
    category: string,
    options?: { minReduction?: number; maxResults?: number }
  ) {
    if (!MONGODB_URI) return [];

    try {
      await connectDB();
      const CarbonAlternative = mongoose.models.CarbonAlternative ||
        // @ts-ignore
        (await import('../models/CarbonAlternative')).default;

      const result = await CarbonAlternative.findOne({
        'originalMaterial.category': { $regex: category, $options: 'i' },
        isActive: true,
      }).lean();

      if (!result) return [];

      let alternatives = result.alternatives as { reduction?: number }[];

      if (options?.minReduction) {
        alternatives = alternatives.filter(a => (a.reduction || 0) >= options.minReduction!);
      }

      if (options?.maxResults) {
        alternatives = alternatives.slice(0, options.maxResults);
      }

      return alternatives;
    } catch (error) {
      console.error('getLowCarbonAlternatives error:', error);
      return [];
    }
  }

  /**
   * Search materials from cached data
   */
  export async function searchMaterials(
    query: string,
    options?: { category?: string; maxGwp?: number; limit?: number }
  ) {
    if (!MONGODB_URI) return [];

    try {
      await connectDB();
      const Material = mongoose.models.Material ||
        (await import('../models/Material')).default;

      const searchQuery: Record<string, unknown> = {
        isActive: true,
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { subcategory: { $regex: query, $options: 'i' } },
          { tags: { $in: [query.toLowerCase()] } },
        ],
      };

      if (options?.category) {
        searchQuery.category = { $regex: options.category, $options: 'i' };
      }

      if (options?.maxGwp) {
        searchQuery.gwp = { $lte: options.maxGwp };
      }

      const materials = await Material.find(searchQuery)
        .sort({ gwp: 1 })
        .limit(options?.limit || 20)
        .lean();

      return materials;
    } catch (error) {
      console.error('searchMaterials error:', error);
      return [];
    }
  }

  /**
   * Convert units using cached conversion data
   */
  export async function convertUnits(
    category: string,
    value: number,
    fromUnit: string,
    toUnit: string
  ) {
    if (!MONGODB_URI) return null;

    try {
      await connectDB();
      const UnitConversion = mongoose.models.UnitConversion ||
        // @ts-ignore
        (await import('../models/UnitConversion')).default;

      const conversionDoc = await UnitConversion.findOne({
        materialCategory: { $regex: category, $options: 'i' },
      }).lean();

      if (!conversionDoc) return null;

      interface Conv { fromUnit: string; toUnit: string; factor: number }
      const conversions = conversionDoc.conversions as Conv[];

      let conversion = conversions.find(
        c => c.fromUnit.toLowerCase() === fromUnit.toLowerCase() &&
          c.toUnit.toLowerCase() === toUnit.toLowerCase()
      );

      // Try reverse
      if (!conversion) {
        const reverse = conversions.find(
          c => c.fromUnit.toLowerCase() === toUnit.toLowerCase() &&
            c.toUnit.toLowerCase() === fromUnit.toLowerCase()
        );
        if (reverse) {
          conversion = { fromUnit, toUnit, factor: 1 / reverse.factor };
        }
      }

      // Try density-based
      if (!conversion && conversionDoc.density) {
        if (fromUnit.toLowerCase() === 'm³' && toUnit.toLowerCase() === 'kg') {
          conversion = { fromUnit, toUnit, factor: conversionDoc.density };
        } else if (fromUnit.toLowerCase() === 'kg' && toUnit.toLowerCase() === 'm³') {
          conversion = { fromUnit, toUnit, factor: 1 / conversionDoc.density };
        }
      }

      if (!conversion) return null;

      return {
        inputValue: value,
        inputUnit: fromUnit,
        outputValue: value * conversion.factor,
        outputUnit: toUnit,
        factor: conversion.factor,
      };
    } catch (error) {
      console.error('convertUnits error:', error);
      return null;
    }
  }
