// app/api/suppliers/qualifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supplierQualificationService, SupplierQualification } from '../../../../lib/supplierQualificationService';

interface CreateQualificationRequest {
    supplierId: string;
    supplierName: string;
    documents?: SupplierQualification['documents'];
    certifications?: SupplierQualification['certifications'];
    sustainabilityProfile?: SupplierQualification['sustainabilityProfile'];
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const organizationId = searchParams.get('organizationId');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        // Check if dashboard is requested
        if (searchParams.get('dashboard') === 'true') {
            const dashboard = await supplierQualificationService.getQualificationDashboard(organizationId);
            return NextResponse.json(dashboard);
        }

        const filters = {
            status: searchParams.get('status') as SupplierQualification['status'] | undefined,
            tier: searchParams.get('tier') as SupplierQualification['tier'] | undefined,
            riskLevel: searchParams.get('riskLevel') as SupplierQualification['overallRiskLevel'] | undefined,
            requalificationDue: searchParams.get('requalificationDue') === 'true',
        };

        const qualifications = await supplierQualificationService.listQualifications(organizationId, filters);

        return NextResponse.json({ qualifications });
    } catch (error) {
        console.error('Error listing qualifications:', error);
        return NextResponse.json(
            { error: 'Failed to list qualifications' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as CreateQualificationRequest;
        const organizationId = request.headers.get('x-organization-id');
        const userId = request.headers.get('x-user-id');

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        if (!body.supplierId || !body.supplierName) {
            return NextResponse.json(
                { error: 'Supplier ID and name are required' },
                { status: 400 }
            );
        }

        const qualification = await supplierQualificationService.createQualification({
            supplierId: body.supplierId,
            supplierName: body.supplierName,
            organizationId,
            status: 'pending',
            tier: 'restricted',
            scores: [],
            documents: body.documents || [],
            riskAssessment: [],
            certifications: body.certifications || [],
            sustainabilityProfile: body.sustainabilityProfile,
            complianceChecks: [],
            reviewHistory: [{
                date: new Date(),
                reviewer: userId || 'system',
                action: 'Created qualification',
            }],
            createdBy: userId || 'system',
        });

        return NextResponse.json(qualification, { status: 201 });
    } catch (error) {
        console.error('Error creating qualification:', error);
        return NextResponse.json(
            { error: 'Failed to create qualification' },
            { status: 500 }
        );
    }
}
