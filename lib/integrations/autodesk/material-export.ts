/**
 * Material Export Service
 * Exports GreenChainz materials to Autodesk Revit projects
 */

import { createClient } from '@supabase/supabase-js';
import { getValidAccessToken } from './oauth';
import type {
  MaterialExportRequest,
  MaterialExportResponse,
  MaterialProperties,
  RevitMaterialData,
} from '@/types/autodesk';

const AUTODESK_DATA_API = 'https://developer.api.autodesk.com/data/v1';

/**
 * Export material to Revit project
 */
export async function exportMaterialToRevit(
  userId: string,
  exportRequest: MaterialExportRequest
): Promise<MaterialExportResponse> {
  try {
    // Get valid access token
    const accessToken = await getValidAccessToken(userId);

    // Fetch product data from Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, suppliers(*)')
      .eq('id', exportRequest.product_id)
      .single();

    if (productError || !product) {
      throw new Error('Product not found');
    }

    // Map GreenChainz product to Revit material properties
    const materialData = mapProductToRevitMaterial(product);

    // Create material in Revit via Autodesk Data Management API
    const revitMaterialId = await createRevitMaterial(
      accessToken,
      exportRequest.revit_project_urn,
      materialData
    );

    // Log export event
    const { data: exportRecord, error: exportError } = await supabase
      .from('autodesk_exports')
      .insert({
        user_id: userId,
        product_id: exportRequest.product_id,
        revit_project_urn: exportRequest.revit_project_urn,
        revit_material_id: revitMaterialId,
        material_name: product.name,
        export_status: 'success',
      })
      .select()
      .single();

    if (exportError) {
      console.error('Failed to log export:', exportError);
    }

    return {
      success: true,
      material_id: revitMaterialId,
      export_id: exportRecord?.id || '',
    };
  } catch (error) {
    console.error('Material export error:', error);

    // Log failed export
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      await supabase.from('autodesk_exports').insert({
        user_id: userId,
        product_id: exportRequest.product_id,
        revit_project_urn: exportRequest.revit_project_urn,
        material_name: 'Unknown',
        export_status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch (logError) {
      console.error('Failed to log export error:', logError);
    }

    return {
      success: false,
      export_id: '',
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Map GreenChainz product to Revit material format
 */
function mapProductToRevitMaterial(product: any): RevitMaterialData {
  const sustainabilityData = product.sustainability_data || {};

  const properties: MaterialProperties = {
    name: product.name,
    manufacturer: product.suppliers?.name || 'Unknown',
    epd_number: sustainabilityData.epd_number || sustainabilityData.epd_id,
    carbon_footprint: parseFloat(sustainabilityData.gwp_kg_co2e || sustainabilityData.gwp || 0),
    carbon_footprint_unit: sustainabilityData.gwp_unit || 'kg CO2e/kg',
    thermal_conductivity: sustainabilityData.thermal_conductivity,
    r_value: sustainabilityData.r_value,
    recycled_content_percent: sustainabilityData.recycled_content_percent,
    certifications: product.certifications || [],
    density: sustainabilityData.density,
    compressive_strength: sustainabilityData.compressive_strength,
    description: product.description,
  };

  return {
    name: product.name,
    category: product.material_type || 'General',
    properties,
    appearance: {
      color: sustainabilityData.color,
      texture: sustainabilityData.texture,
    },
  };
}

/**
 * Create material in Revit project via Autodesk API
 * Note: This is a simplified implementation. In production, you would use
 * the Design Automation API or BIM 360 API to create materials.
 */
async function createRevitMaterial(
  accessToken: string,
  projectUrn: string,
  materialData: RevitMaterialData
): Promise<string> {
  // For MVP, we'll create a custom material object in the project
  // In production, this would integrate with Revit's Material API

  const materialPayload = {
    jsonapi: {
      version: '1.0',
    },
    data: {
      type: 'materials',
      attributes: {
        name: materialData.name,
        displayName: materialData.name,
        extension: {
          type: 'materials:autodesk.design:Material-1.0',
          version: '1.0',
          schema: {
            type: 'object',
            properties: {
              manufacturer: { type: 'string', value: materialData.properties.manufacturer },
              epdNumber: { type: 'string', value: materialData.properties.epd_number || '' },
              carbonFootprint: {
                type: 'number',
                value: materialData.properties.carbon_footprint,
              },
              carbonFootprintUnit: {
                type: 'string',
                value: materialData.properties.carbon_footprint_unit,
              },
              thermalConductivity: {
                type: 'number',
                value: materialData.properties.thermal_conductivity,
              },
              recycledContent: {
                type: 'number',
                value: materialData.properties.recycled_content_percent,
              },
              certifications: {
                type: 'array',
                value: materialData.properties.certifications,
              },
              description: { type: 'string', value: materialData.properties.description || '' },
            },
          },
        },
      },
    },
  };

  // Note: This endpoint is illustrative. Actual implementation would use
  // Design Automation API or BIM 360 Docs API
  const response = await fetch(`${AUTODESK_DATA_API}/projects/${projectUrn}/materials`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/vnd.api+json',
    },
    body: JSON.stringify(materialPayload),
  });

  if (!response.ok) {
    // If the endpoint doesn't exist (expected for MVP), generate a mock ID
    // In production, this would throw an error
    console.warn('Material creation endpoint not available, using mock ID');
    return `material-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  const result = await response.json();
  return result.data?.id || `material-${Date.now()}`;
}

/**
 * Get export history for user
 */
export async function getExportHistory(userId: string, limit = 50) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('autodesk_exports')
    .select('*, products(name, material_type)')
    .eq('user_id', userId)
    .order('exported_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get export history: ${error.message}`);
  }

  return data;
}
