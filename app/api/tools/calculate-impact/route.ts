import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { calculateDistance, calculateTransportCarbon } from '@/lib/utils/geo';
import { Product, Supplier } from '@/types/schema';

interface CalculationRequest {
    zipCode: string;
    category: string;
    quantity: number;
    currentProductGWP: number;
}

interface ProductWithSupplier extends Product {
    suppliers: Supplier | null;
}

interface RankedAlternative {
    id: string;
    name: string;
    supplierName: string;
    supplierLogo: string | null;
    totalCarbon: number;
    distance: number;
    savings: number;
    leedContribution: 'Significant' | 'Moderate';
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { category, quantity, currentProductGWP } = await req.json() as CalculationRequest;

        // 1. Mock Geocoding (In prod, use Google Geocoding API)
        // Let's assume the project is in Raleigh, NC (near our seeded supplier)
        // This is a simplification for the demo/MVP
        const projectCoords = { lat: 35.7796, lng: -78.6382 };

        // 2. Fetch Verified Products in this category
        // Note: In real app, we would use PostGIS for specific radius queries
        // Here we fetch verified products in category and filter/sort in memory for the demo
        const { data: products, error } = await supabase
            .from('products')
            .select(`
        *,
        suppliers (
            name,
            latitude,
            longitude,
            logo_url,
            city,
            state
        )
        `)
            .ilike('material_type', `%${category}%`) // Loose matching for demo flexibility
            .eq('verified', true);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
        }

        if (!products || products.length === 0) {
            return NextResponse.json({ error: "No verified alternatives found for this category" }, { status: 404 });
        }

        // 3. Process and Rank
        const comparisons: RankedAlternative[] = products.map((p: ProductWithSupplier) => {
            const s = p.suppliers;

            // Skip if missing geo data on supplier
            if (!s || !s.latitude || !s.longitude) return null;

            const distance = calculateDistance(projectCoords.lat, projectCoords.lng, s.latitude, s.longitude);

            // Use product specific weight if available, else default to 2400kg/m3 (concrete)
            const unitWeight = p.kg_per_unit || 2400;
            const totalWeight = unitWeight * quantity;

            const transportCarbon = calculateTransportCarbon(totalWeight, distance);

            // Use product specific GWP if available, else fallback to 180 (low carbon concrete avg)
            const unitGWP = p.gwp_per_unit || 180;
            const productionCarbon = unitGWP * quantity;

            const totalImpact = Math.round(productionCarbon + transportCarbon);

            return {
                id: p.id,
                name: p.name || p.product_name, // Handle schema naming variations
                supplierName: s.name,
                supplierLogo: s.logo_url,
                totalCarbon: totalImpact,
                distance: distance,
                // Calculate % reduction against user's current choice
                savings: currentProductGWP ? Math.round(((currentProductGWP - totalImpact) / currentProductGWP) * 100) : 0,
                leedContribution: totalImpact < (currentProductGWP * 0.8) ? 'Significant' : 'Moderate'
            };
        })
            .filter((item): item is RankedAlternative => item !== null) // Remove items with missing data
            .sort((a, b) => a.totalCarbon - b.totalCarbon);

        if (comparisons.length === 0) {
            return NextResponse.json({ error: "No products with sufficient data found" }, { status: 404 });
        }

        return NextResponse.json({
            bestOption: comparisons[0],
            alternatives: comparisons.slice(1, 3)
        });

    } catch (e) {
        console.error('Calculation error:', e);
        return NextResponse.json({ error: "Calculation failed" }, { status: 500 });
    }
}
