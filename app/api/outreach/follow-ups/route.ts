/**
 * Follow-ups API
 * 
 * GET /api/outreach/follow-ups
 * Returns leads that are due for follow-up.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLeadModel } from '../../../../models/Lead';
import {
  GetFollowUpsResponse,
  FollowUpLead,
  EmailType,
} from '../../../../types/outreach';

export const dynamic = 'force-dynamic';

const MAX_FOLLOW_UPS = parseInt(process.env.OUTREACH_MAX_FOLLOW_UPS || '3', 10);

function getNextEmailType(followUpCount: number): EmailType {
  switch (followUpCount) {
    case 0:
      return EmailType.INITIAL;
    case 1:
      return EmailType.FOLLOW_UP_1;
    case 2:
      return EmailType.FOLLOW_UP_2;
    case 3:
      return EmailType.FOLLOW_UP_3;
    default:
      return EmailType.FOLLOW_UP_3;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse<GetFollowUpsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);

    const Lead = await getLeadModel();

    const now = new Date();

    // Find leads due for follow-up
    const leads = await Lead.find({
      autoFollowUpEnabled: true,
      nextFollowUpAt: { $lte: now },
      followUpCount: { $lt: MAX_FOLLOW_UPS + 1 }, // +1 because initial is count 0
      status: { $nin: ['converted', 'cold', 'responded', 'meeting_scheduled'] },
    })
      .sort({ nextFollowUpAt: 1 })
      .limit(limit)
      .lean();

    // Transform to follow-up response format
    const followUps: FollowUpLead[] = leads.map(lead => {
      const lastContactedAt = lead.lastContactedAt ? new Date(lead.lastContactedAt) : lead.createdAt;
      const daysSinceLastContact = Math.floor(
        (now.getTime() - new Date(lastContactedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        lead: lead as unknown as FollowUpLead['lead'],
        nextEmailType: getNextEmailType(lead.followUpCount || 0),
        daysSinceLastContact,
      };
    });

    return NextResponse.json({
      success: true,
      followUps,
      total: followUps.length,
    });

  } catch (error) {
    console.error('Get follow-ups error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, followUps: [], total: 0, error: errorMessage },
      { status: 500 }
    );
  }
}
