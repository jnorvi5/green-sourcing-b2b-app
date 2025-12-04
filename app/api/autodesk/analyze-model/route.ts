/**
 * POST /api/autodesk/analyze-model
 * Analyze BIM model for embodied carbon
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { analyzeBIMModel, getAnalysisResult } from '@/lib/integrations/autodesk/bim-analysis';
import type { BIMAnalysisRequest } from '@/types/autodesk';

export async function POST(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body: BIMAnalysisRequest = await request.json();

    if (!body.model_urn) {
      return NextResponse.json({ error: 'Missing required field: model_urn' }, { status: 400 });
    }

    // Start analysis
    const result = await analyzeBIMModel(user.id, body);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Analyze model error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autodesk/analyze-model?analysis_id=xxx
 * Get analysis result
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analysisId = request.nextUrl.searchParams.get('analysis_id');

    if (!analysisId) {
      return NextResponse.json({ error: 'Missing required parameter: analysis_id' }, { status: 400 });
    }

    const result = await getAnalysisResult(user.id, analysisId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get analysis' },
      { status: 500 }
    );
  }
}
