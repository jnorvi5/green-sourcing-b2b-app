// app/api/sustainability/goals/route.ts - Sustainability Goals API
import { NextRequest, NextResponse } from 'next/server';
import { sustainabilityReportingService, SustainabilityGoal } from '../../../../lib/sustainabilityReportingService';

interface CreateGoalBody {
  organizationId: string;
  name: string;
  description: string;
  category: SustainabilityGoal['category'];
  metricType: string;
  baselineValue: number;
  baselineDate: string;
  targetValue: number;
  targetDate: string;
  currentValue: number;
  unit: string;
  trackingFrequency: SustainabilityGoal['trackingFrequency'];
  linkedSDGs?: number[];
}

// GET /api/sustainability/goals - List active sustainability goals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organizationId is required' },
        { status: 400 }
      );
    }

    const goals = await sustainabilityReportingService.getActiveGoals(organizationId);

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error listing sustainability goals:', error);
    return NextResponse.json(
      { error: 'Failed to list goals' },
      { status: 500 }
    );
  }
}

// POST /api/sustainability/goals - Create a new sustainability goal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateGoalBody;
    const {
      organizationId,
      name,
      description,
      category,
      metricType,
      baselineValue,
      baselineDate,
      targetValue,
      targetDate,
      currentValue,
      unit,
      trackingFrequency,
      linkedSDGs = [],
    } = body;

    if (!organizationId || !name || !category || !targetValue || !targetDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const goal = await sustainabilityReportingService.createGoal({
      organizationId,
      name,
      description: description || '',
      category,
      metricType: metricType || '',
      baselineValue: baselineValue || 0,
      baselineDate: baselineDate ? new Date(baselineDate) : new Date(),
      targetValue,
      targetDate: new Date(targetDate),
      currentValue: currentValue || baselineValue || 0,
      unit: unit || '',
      trackingFrequency: trackingFrequency || 'monthly',
      status: 'active',
      milestones: [],
      linkedSDGs,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating sustainability goal:', error);
    return NextResponse.json(
      { error: 'Failed to create goal' },
      { status: 500 }
    );
  }
}
