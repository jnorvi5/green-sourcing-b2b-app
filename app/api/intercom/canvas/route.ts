// app/api/intercom/canvas/route.ts
export async function POST(request: NextRequest) {
  const { component_id, input_values } = await request.json();
  
  const materialQuery = input_values.material_search;
  
  // Fetch materials from your DB
  const materials = await searchMaterials(materialQuery);
  
  // Return Canvas Kit format
  return NextResponse.json({
    canvas: {
      content: {
        components: [
          {
            type: 'text',
            text: `Found ${materials.length} sustainable materials:`,
            style: 'header',
          },
          ...materials.map(m => ({
            type: 'button',
            label: `${m.name} (${m.gwp} kg CO2e)`,
            action: {
              type: 'url',
              url: `https://greenchainz.com/materials/${m.id}`,
            },
          })),
        ],
      },
    },
  });
}
