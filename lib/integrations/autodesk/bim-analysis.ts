/**
 * BIM Analysis Service
 * Analyzes BIM models to calculate embodied carbon
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { getValidAccessToken } from './oauth';
import { batchMatchMaterials, getLowCarbonAlternatives } from './material-matcher';
import type {
  BIMAnalysisRequest,
  BIMAnalysisResponse,
  AnalysisData,
  MaterialAnalysis,
  CarbonAlternative,
  ModelDerivativeManifest,
  ModelProperties,
} from '@/types/autodesk';

const MODEL_DERIVATIVE_API = 'https://developer.api.autodesk.com/modelderivative/v2';

/**
 * Zod schema for validating Autodesk URN (URL-safe Base64 format)
 * Autodesk URNs are Base64-encoded and must only contain URL-safe characters.
 * This prevents SSRF attacks via path traversal or URL manipulation.
 */
export const autodeskUrnSchema = z
  .string()
  .min(1, 'Model URN is required')
  .max(1000, 'Model URN exceeds maximum length')
  .regex(
    /^[A-Za-z0-9_-]+$/,
    'Model URN must contain only URL-safe Base64 characters (A-Za-z0-9_-)'
  )
  .refine(
    (urn) => !urn.includes('..') && !urn.includes('//') && !urn.includes('#'),
    'Model URN must not contain path traversal patterns'
  );

/**
 * Zod schema for validating Autodesk viewable GUID
 */
export const viewableGuidSchema = z
  .string()
  .uuid('Viewable GUID must be a valid UUID');

/**
 * Builds a validated Model Derivative API URL
 * @param modelUrn - The Base64-encoded model URN
 * @param path - Additional path segments (e.g., 'manifest' or 'metadata/{guid}/properties')
 * @returns The complete API URL
 * @throws ZodError if the URN validation fails
 */
export function buildModelDerivativeUrl(modelUrn: string, path: string): string {
  // Validate the URN to prevent SSRF attacks
  const validatedUrn = autodeskUrnSchema.parse(modelUrn);
  
  // URL-encode the validated URN to ensure safe usage in the URL path
  const encodedUrn = encodeURIComponent(validatedUrn);
  
  return `${MODEL_DERIVATIVE_API}/designdata/${encodedUrn}/${path}`;
}

/**
 * Analyze BIM model for embodied carbon
 */
export async function analyzeBIMModel(
  userId: string,
  request: BIMAnalysisRequest
): Promise<BIMAnalysisResponse> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Create analysis record
    const { data: analysis, error: createError } = await supabase
      .from('bim_analyses')
      .insert({
        user_id: userId,
        model_urn: request.model_urn,
        model_name: request.model_name,
        analysis_status: 'processing',
      })
      .select()
      .single();

    if (createError || !analysis) {
      throw new Error('Failed to create analysis record');
    }

    // Start async processing
    processModelAnalysis(userId, analysis.id, request).catch((error) => {
      console.error('Model analysis error:', error);
    });

    return {
      analysis_id: analysis.id,
      status: 'processing',
    };
  } catch (error) {
    console.error('BIM analysis error:', error);
    return {
      analysis_id: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

/**
 * Process model analysis (async)
 */
async function processModelAnalysis(
  userId: string,
  analysisId: string,
  request: BIMAnalysisRequest
): Promise<void> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    // Get access token
    const accessToken = await getValidAccessToken(userId);

    // Extract materials from model
    const materials = await extractMaterialsFromModel(accessToken, request.model_urn);

    // Match materials to GreenChainz products
    const materialMatches = await batchMatchMaterials(
      materials.map((m) => ({ name: m.name, category: m.category }))
    );

    // Calculate carbon for each material
    const materialAnalyses: MaterialAnalysis[] = materials.map((material) => {
      const match = materialMatches.get(material.name);

      const carbonPerUnit = match?.carbon_footprint || 0;
      const totalCarbon = material.quantity * carbonPerUnit;

      return {
        id: material.id,
        name: material.name,
        category: material.category,
        quantity: material.quantity,
        unit: material.unit,
        carbon_per_unit: carbonPerUnit,
        total_carbon: totalCarbon,
        matched_product_id: match?.product_id,
        match_confidence: match?.confidence_score,
        match_type: match?.match_type || 'none',
      };
    });

    // Calculate total carbon
    const totalCarbon = materialAnalyses.reduce((sum, m) => sum + m.total_carbon, 0);

    // Calculate breakdown by category
    const byCategory: Record<string, { carbon_kg: number; percentage: number }> = {};
    materialAnalyses.forEach((m) => {
      if (!byCategory[m.category]) {
        byCategory[m.category] = { carbon_kg: 0, percentage: 0 };
      }
      byCategory[m.category].carbon_kg += m.total_carbon;
    });

    Object.keys(byCategory).forEach((category) => {
      byCategory[category].percentage = (byCategory[category].carbon_kg / totalCarbon) * 100;
    });

    // Get top contributors
    const topContributors = materialAnalyses
      .sort((a, b) => b.total_carbon - a.total_carbon)
      .slice(0, 5)
      .map((m) => ({
        material_name: m.name,
        carbon_kg: m.total_carbon,
        percentage: (m.total_carbon / totalCarbon) * 100,
      }));

    // Get low-carbon alternatives for top contributors
    const alternatives: CarbonAlternative[] = [];
    for (const contributor of topContributors.slice(0, 5)) {
      if (!contributor) continue;
      
      const material = materialAnalyses.find((m) => m.name === contributor.material_name);
      if (!material) continue;

      const alts = await getLowCarbonAlternatives(
        material.category,
        material.carbon_per_unit,
        3
      );

      if (alts && alts.length > 0) {
        alts.forEach((alt) => {
          alternatives.push({
            original_material: material.name,
            original_carbon_kg: material.total_carbon,
            alternative_name: alt.product_name,
            alternative_carbon_kg: alt.carbon_footprint * material.quantity,
            carbon_reduction_kg:
              material.total_carbon - alt.carbon_footprint * material.quantity,
            carbon_reduction_percent: alt.reduction_percent,
            product_id: alt.product_id,
          });
        });
      }
    }

    // Build analysis data
    const analysisData: AnalysisData = {
      materials: materialAnalyses,
      breakdown: {
        total_kg: totalCarbon,
        by_category: byCategory,
        top_contributors: topContributors,
      },
      metadata: {
        model_urn: request.model_urn,
        model_name: request.model_name,
        extracted_materials_count: materials.length,
        matched_materials_count: materialAnalyses.filter((m) => m.matched_product_id).length,
        unmatched_materials_count: materialAnalyses.filter((m) => !m.matched_product_id).length,
      },
    };

    // Update analysis record
    await supabase
      .from('bim_analyses')
      .update({
        analysis_status: 'completed',
        total_carbon_kg: totalCarbon,
        analysis_data: analysisData,
        alternatives: alternatives,
        completed_at: new Date().toISOString(),
      })
      .eq('id', analysisId);
  } catch (error) {
    console.error('Process model analysis error:', error);

    // Update with error
    await supabase
      .from('bim_analyses')
      .update({
        analysis_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', analysisId);
  }
}

/**
 * Extract materials from BIM model using Model Derivative API
 */
async function extractMaterialsFromModel(
  accessToken: string,
  modelUrn: string
): Promise<
  Array<{
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }>
> {
  // Validate modelUrn before using it in any API calls (SSRF prevention)
  // This will throw a ZodError with a clear message if validation fails
  autodeskUrnSchema.parse(modelUrn);

  // Get model manifest using validated URL builder
  const manifestUrl = buildModelDerivativeUrl(modelUrn, 'manifest');
  const manifestResponse = await fetch(manifestUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!manifestResponse.ok) {
    throw new Error(`Failed to get model manifest: ${manifestResponse.status}`);
  }

  const manifest: ModelDerivativeManifest = await manifestResponse.json();

  // Find the first 3D view
  const derivative = manifest.derivatives?.find((d) => d.outputType === 'svf2' || d.outputType === 'svf');
  const viewable = derivative?.children?.find((c) => c.role === '3d');

  if (!viewable) {
    throw new Error('No 3D viewable found in model');
  }

  // Validate the viewable GUID before using it in the URL
  const validatedGuid = viewableGuidSchema.parse(viewable.guid);

  // Get model properties using validated URL builder
  const propertiesUrl = buildModelDerivativeUrl(
    modelUrn,
    `metadata/${encodeURIComponent(validatedGuid)}/properties`
  );
  const propertiesResponse = await fetch(propertiesUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!propertiesResponse.ok) {
    throw new Error(`Failed to get model properties: ${propertiesResponse.status}`);
  }

  const properties: ModelProperties = await propertiesResponse.json();

  // Extract materials from properties
  const materialsMap = new Map<
    string,
    {
      id: string;
      name: string;
      category: string;
      quantity: number;
      unit: string;
    }
  >();

  properties.data.collection.forEach((obj) => {
    const props = obj.properties as any;

    // Look for material-related properties
    const materialName =
      props.Material || props['Material Name'] || props.material || 'Unknown Material';
    const category = props.Category || props.category || 'General';
    const volume = parseFloat(props.Volume || props.volume || 0);
    const area = parseFloat(props.Area || props.area || 0);

    // Determine quantity and unit
    let quantity = volume || area || 1;
    let unit = volume ? 'm³' : area ? 'm²' : 'unit';

    const materialKey = `${materialName}-${category}`;

    if (materialsMap.has(materialKey)) {
      const existing = materialsMap.get(materialKey)!;
      existing.quantity += quantity;
    } else {
      materialsMap.set(materialKey, {
        id: `${obj.objectid}`,
        name: materialName,
        category,
        quantity,
        unit,
      });
    }
  });

  return Array.from(materialsMap.values());
}

/**
 * Get analysis result
 */
export async function getAnalysisResult(userId: string, analysisId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('bim_analyses')
    .select('*')
    .eq('id', analysisId)
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Failed to get analysis: ${error.message}`);
  }

  return data;
}
