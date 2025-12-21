import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * GET /api/autodesk
 * Health check + endpoint discovery
 */
export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'active',
      service: 'GreenChainz Autodesk Integration',
      endpoints: [
        '/api/autodesk/connect',
        '/api/autodesk/analyze-model',
        '/api/autodesk/export-material',
        '/api/autodesk/status',
        '/api/autodesk/callback'
      ],
      timestamp: new Date().toISOString()
    },
    { status: 200 }
  );
}

/**
 * POST /api/autodesk
 * Router for requests without explicit endpoint
 * Expects: { action: string, ...payload }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json(
        {
          error: 'Missing action parameter',
          availableActions: [
            'connect',
            'analyze-model',
            'export-material',
            'status'
          ],
          example: { action: 'status' }
        },
        { status: 400 }
      );
    }

    // Route to specific endpoint
    const actionMap: Record<string, string> = {
      connect: '/api/autodesk/connect',
      'analyze-model': '/api/autodesk/analyze-model',
      'export-material': '/api/autodesk/export-material',
      status: '/api/autodesk/status'
    };

    const endpoint = actionMap[action];
    if (!endpoint) {
      return NextResponse.json(
        {
          error: `Unknown action: ${action}`,
          availableActions: Object.keys(actionMap)
        },
        { status: 400 }
      );
    }

    // In production, would forward request to specific endpoint handler
    // For now, return routing info
    return NextResponse.json(
      {
        message: `Route to ${endpoint}`,
        action,
        endpoint,
        note: 'Call specific endpoint directly for full functionality'
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Autodesk base route error:', error);
    return NextResponse.json(
      {
        error: 'Invalid request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}
