import { NextRequest, NextResponse } from 'next/server';
import { searchMaterials } from '@/lib/integrations/autodesk/material-matcher';
import type { MaterialMatch } from '@/types/autodesk';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { componentId } = body;

  const matches = await searchMaterials(componentId);

  return NextResponse.json({
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            text: `Found ${matches.length} sustainable materials:`,
            style: 'header',
          },
          ...matches.map((m: MaterialMatch) => ({
            type: 'button',
            label: `${m.product_name} (${m.carbon_footprint} kg CO2e)`,
            action: {
              type: 'url',
              url: `https://greenchainz.com/materials/${m.product_id}`,
            },
          })),
        ],
      },
    },
  });
}
