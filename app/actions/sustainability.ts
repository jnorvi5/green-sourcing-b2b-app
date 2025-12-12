'use server';

import { fetchSustainabilityData } from '@/lib/agents/data-aggregation';

export async function getSustainabilityData(productId: string, materialType: string) {
  try {
    const data = await fetchSustainabilityData(productId, materialType);
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch sustainability data:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}
