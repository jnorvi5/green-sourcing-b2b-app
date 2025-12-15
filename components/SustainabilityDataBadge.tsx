'use client';

'use client';

import { useSustainabilityData } from '@/lib/hooks/useSustainabilityData';

function Spinner() {
  return (
    <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
  );
}

interface SustainabilityDataBadgeProps {
  productId: string;
  materialType: string;
}

export function SustainabilityDataBadge({ productId, materialType }: SustainabilityDataBadgeProps) {
  const { data, loading, error } = useSustainabilityData(productId, materialType);
  
  if (loading) return <div className="flex items-center gap-2 text-sm text-gray-500"><Spinner /> Checking sustainability data...</div>;
  if (error) return <div className="text-xs text-red-500">Error loading data</div>;
  
  return (
    <div className="sustainability-badge bg-green-50 p-3 rounded-lg border border-green-100 text-sm">
      <div className="flex flex-col gap-2">
        {/* EC3 Data */}
        {data.embodied_carbon_gwp && (
          <div className="flex justify-between items-start">
            <div>
              <strong className="text-green-900 block">Embodied Carbon</strong>
              <span className="text-green-800">{data.embodied_carbon_gwp}</span>
              {data.ec3_source && (
                  <div className="text-[9px] text-gray-500 mt-0.5 max-w-[150px] leading-tight">
                    {data.ec3_source}
                  </div>
              )}
            </div>
            <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded shrink-0">EC3</span>
          </div>
        )}
        
        {/* EPD Data */}
        <div className="flex items-center gap-1">
            <strong className="text-green-900">EPD Certified:</strong> 
            <span className={data.epd_certified ? "text-green-700 font-medium" : "text-gray-500"}>
                {data.epd_certified ? "✓ Yes" : "✗ No"}
            </span>
        </div>

        {/* FSC Data */}
        {data.fsc_certified && (
            <div className="flex justify-between items-center">
                 <strong className="text-green-900">FSC Certified</strong>
                 <span className="text-[10px] text-green-600 bg-green-100 px-1.5 py-0.5 rounded">Verifed</span>
            </div>
        )}

        {/* Autodesk Data */}
        {data.autodesk_carbon_score && (
            <div className="pt-2 border-t border-green-200 mt-1">
                <div className="flex justify-between items-center">
                    <span className="text-gray-600 text-xs">Autodesk Carbon Score</span>
                    <span className={`font-bold ${
                        data.autodesk_carbon_score === 'A' ? 'text-green-600' : 
                        data.autodesk_carbon_score === 'B' ? 'text-yellow-600' : 'text-red-500'
                    }`}>
                        {data.autodesk_carbon_score}
                    </span>
                </div>
            </div>
        )}
        
        <div className="text-[10px] text-gray-400 mt-1 pt-1 border-t border-green-100 text-right">
            Updated: {new Date(data.data_freshness || Date.now()).toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}
