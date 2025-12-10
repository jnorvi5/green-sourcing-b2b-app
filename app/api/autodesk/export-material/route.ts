/**
 * POST /api/autodesk/export-material
 * Export GreenChainz material to Revit project
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { exportMaterialToRevit } from '@/lib/integrations/autodesk/material-export';
import type { MaterialExportRequest } from '@/types/autodesk';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env['NEXT_PUBLIC_SUPABASE_URL']!,
      process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: MaterialExportRequest = await request.json();

    if (!body.product_id || !body.revit_project_urn) {
      return NextResponse.json(
        { error: 'Missing required fields: product_id, revit_project_urn' },
        { status: 400 }
      );
    }

    // Export material
    const result = await exportMaterialToRevit(user.id, body);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Export material error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}
