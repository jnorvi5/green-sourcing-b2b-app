'use client';

import { useState, useEffect } from 'react';
import { getSustainabilityData } from '@/app/actions/sustainability';
import { SustainabilityData } from '@/lib/agents/data-aggregation';

interface UseSustainabilityDataResult {
  data: Partial<SustainabilityData>;
  loading: boolean;
  error: string | null;
}

export function useSustainabilityData(productId: string, materialType: string): UseSustainabilityDataResult {
  const [data, setData] = useState<Partial<SustainabilityData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      if (!productId) return;
      
      try {
        setLoading(true);
        const result = await getSustainabilityData(productId, materialType);
        
        if (!mounted) return;

        if (result.success && result.data) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error || 'Failed to fetch data');
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [productId, materialType]);

  return { data, loading, error };
}
