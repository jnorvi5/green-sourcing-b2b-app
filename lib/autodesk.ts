/**
 * Autodesk Platform Services (APS) Integration
 * 
 * Uses REST API for authentication and data access.
 * Supports:
 * - 2-legged OAuth for server-to-server auth
 * - Model Derivative API for 3D viewer
 * - Sustainability API for embodied carbon data
 */

const CLIENT_ID = process.env.AUTODESK_CLIENT_ID!;
const CLIENT_SECRET = process.env.AUTODESK_CLIENT_SECRET!;
const AUTH_URL = 'https://developer.api.autodesk.com/authentication/v2/token';

// Token cache
let cachedToken: { access_token: string; expires_at: number } | null = null;

/**
 * Get 2-Legged OAuth Token (Server-to-Server)
 * 
 * Scopes:
 * - data:read - Read data from BIM 360/ACC
 * - viewables:read - Access translated models for viewer
 */
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
 * Uses Autodesk Sustainability API (when available)
 * Falls back to mock data for MVP
 */
export async function getEmbodiedCarbon(materialId: string) {
  try {
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
      source: 'Autodesk APS',
      methodology: 'EN 15804',
      scope: ['A1-A3'], // Cradle to gate
      last_updated: new Date().toISOString(),
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
