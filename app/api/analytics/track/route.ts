/**
 * Analytics Tracking API
 * POST /api/analytics/track
 * 
 * Tracks anonymized search and filter events for data licensing.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateSessionId,
  detectDeviceType,
  trackSearch,
  trackFilter,
  trackRFQEvent,
  type SearchEvent,
  type FilterEvent,
  type RFQAnalyticsEvent,
} from '@/lib/analyticsService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface TrackRequest {
  eventType: 'search' | 'filter' | 'rfq';
  data: SearchEvent | FilterEvent | RFQAnalyticsEvent;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TrackRequest;
    const { eventType, data } = body;

    if (!eventType || !data) {
      return NextResponse.json(
        { error: 'Missing eventType or data' },
        { status: 400 }
      );
    }

    // Generate anonymized session ID
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
    const sessionId = generateSessionId(userAgent, ipAddress);

    // Detect device type
    const deviceType = detectDeviceType(userAgent);

    // Extract geographic region from request (simplified - in production use GeoIP)
    const geographicRegion = request.headers.get('x-vercel-ip-country') || 
                             request.headers.get('cf-ipcountry') || 
                             'Unknown';

    let result: { success: boolean; error?: string };

    switch (eventType) {
      case 'search':
        const searchEvent = data as SearchEvent;
        result = await trackSearch(sessionId, {
          ...searchEvent,
          deviceType,
          geographicRegion: searchEvent.geographicRegion || geographicRegion,
        });
        break;

      case 'filter':
        const filterEvent = data as FilterEvent;
        result = await trackFilter(sessionId, {
          ...filterEvent,
          geographicRegion: filterEvent.geographicRegion || geographicRegion,
        });
        break;

      case 'rfq':
        const rfqEvent = data as RFQAnalyticsEvent;
        result = await trackRFQEvent(rfqEvent);
        break;

      default:
        return NextResponse.json(
          { error: `Unknown event type: ${eventType}` },
          { status: 400 }
        );
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to track event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
