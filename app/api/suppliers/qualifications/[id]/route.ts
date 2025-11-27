// app/api/suppliers/qualifications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supplierQualificationService, QualificationScore, RiskAssessment } from '../../../../../lib/supplierQualificationService';

interface UpdateQualificationRequest {
    status?: 'pending' | 'in_review' | 'qualified' | 'conditionally_qualified' | 'disqualified' | 'suspended';
    tier?: 'preferred' | 'approved' | 'provisional' | 'restricted';
    scores?: QualificationScore[];
    riskAssessment?: RiskAssessment[];
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const qualification = await supplierQualificationService.getQualification(id);

        if (!qualification) {
            return NextResponse.json(
                { error: 'Qualification not found' },
                { status: 404 }
            );
        }

        // Get default criteria for reference
        const criteria = supplierQualificationService.getDefaultCriteria();

        return NextResponse.json({ qualification, criteria });
    } catch (error) {
        console.error('Error fetching qualification:', error);
        return NextResponse.json(
            { error: 'Failed to fetch qualification' },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json() as UpdateQualificationRequest;
        const userId = request.headers.get('x-user-id') || 'system';

        let qualification;

        if (body.scores) {
            // Evaluate criteria and update scores
            qualification = await supplierQualificationService.evaluateCriteria(id, body.scores, userId);
        } else if (body.riskAssessment) {
            // Perform risk assessment
            qualification = await supplierQualificationService.performRiskAssessment(id, body.riskAssessment, userId);
        } else {
            // General update
            qualification = await supplierQualificationService.updateQualification(id, body, userId);
        }

        if (!qualification) {
            return NextResponse.json(
                { error: 'Qualification not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(qualification);
    } catch (error) {
        console.error('Error updating qualification:', error);
        return NextResponse.json(
            { error: 'Failed to update qualification' },
            { status: 500 }
        );
    }
}
