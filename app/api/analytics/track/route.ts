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

// Validation helper functions
function isValidString(value: unknown, maxLength: number = 500): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

function isValidNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

function sanitizeString(str: string, maxLength: number = 500): string {
  // Remove control characters and limit length
  return str.replace(/[\x00-\x1F\x7F]/g, '').substring(0, maxLength);
}

function validateSearchEvent(data: unknown): data is SearchEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  return isValidString(event['searchQuery'], 500) && 
         (event['resultCount'] === undefined || isValidNumber(event['resultCount']));
}

function validateFilterEvent(data: unknown): data is FilterEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  const validTypes = ['carbon_footprint', 'certification', 'price', 'material_type', 'location', 'lead_time'];
  return isValidString(event['filterType'], 50) && 
         validTypes.includes(event['filterType'] as string) &&
         isValidString(event['filterValue'], 255);
}

function validateRFQEvent(data: unknown): data is RFQAnalyticsEvent {
  if (typeof data !== 'object' || data === null) return false;
  const event = data as Record<string, unknown>;
  return isValidNumber(event['rfqId']) &&
         isValidString(event['materialType'], 100) &&
         Array.isArray(event['certifications']) &&
         isValidString(event['geographicRegion'], 100);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TrackRequest;
    const { eventType, data } = body;

    // Validate eventType
    if (!eventType || !['search', 'filter', 'rfq'].includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid or missing eventType. Must be search, filter, or rfq.' },
        { status: 400 }
      );
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: 'Missing or invalid data object' },
        { status: 400 }
      );
    }

    // Generate anonymized session ID
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0]?.trim() || 'unknown' : 'unknown';
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
        if (!validateSearchEvent(data)) {
          return NextResponse.json(
            { error: 'Invalid search event data. Required: searchQuery (string)' },
            { status: 400 }
          );
        }
        const searchEvent = data as SearchEvent;
        result = await trackSearch(sessionId, {
          ...searchEvent,
          searchQuery: sanitizeString(searchEvent.searchQuery),
          deviceType,
          geographicRegion: searchEvent.geographicRegion || geographicRegion,
        });
        break;

      case 'filter':
        if (!validateFilterEvent(data)) {
          return NextResponse.json(
            { error: 'Invalid filter event data. Required: filterType (string), filterValue (string)' },
            { status: 400 }
          );
        }
        const filterEvent = data as FilterEvent;
        result = await trackFilter(sessionId, {
          ...filterEvent,
          filterValue: sanitizeString(filterEvent.filterValue, 255),
          geographicRegion: filterEvent.geographicRegion || geographicRegion,
        });
        break;

      case 'rfq':
        if (!validateRFQEvent(data)) {
          return NextResponse.json(
            { error: 'Invalid RFQ event data. Required: rfqId (number), materialType (string), certifications (array), geographicRegion (string)' },
            { status: 400 }
          );
        }
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
