// app/api/rfqs/[id]/collaboration/route.ts - RFQ Collaboration API
import { NextRequest, NextResponse } from 'next/server';
import { rfqCollaborationService, RFQCollaborator } from '../../../../../lib/rfqCollaborationService';

interface RouteContext {
    params: Promise<{ id: string }>;
}

// GET /api/rfqs/[id]/collaboration - Get collaboration data for an RFQ
export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: rfqId } = await context.params;
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // 'comments', 'activities', 'approval', 'activeUsers'

        switch (type) {
            case 'comments': {
                const includeResolved = searchParams.get('includeResolved') === 'true';
                const comments = await rfqCollaborationService.getComments(rfqId, { includeResolved });
                return NextResponse.json(comments);
            }

            case 'activities': {
                const limit = parseInt(searchParams.get('limit') || '50');
                const activities = await rfqCollaborationService.getActivities(rfqId, limit);
                return NextResponse.json(activities);
            }

            case 'approval': {
                const approval = await rfqCollaborationService.getApproval(rfqId);
                return NextResponse.json(approval);
            }

            case 'activeUsers': {
                const users = await rfqCollaborationService.getActiveUsers(rfqId);
                return NextResponse.json(users);
            }

            default: {
                // Return all collaboration data
                const [comments, activities, approval, activeUsers] = await Promise.all([
                    rfqCollaborationService.getComments(rfqId),
                    rfqCollaborationService.getActivities(rfqId, 20),
                    rfqCollaborationService.getApproval(rfqId),
                    rfqCollaborationService.getActiveUsers(rfqId),
                ]);

                return NextResponse.json({
                    comments,
                    activities,
                    approval,
                    activeUsers,
                });
            }
        }
    } catch (error) {
        console.error('Error fetching collaboration data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch collaboration data' },
            { status: 500 }
        );
    }
}

interface CollaboratorBody {
    userId: string;
    name: string;
    email: string;
    role: RFQCollaborator['role'];
    addedBy: string;
}

interface CommentBody {
    userId: string;
    userName: string;
    content: string;
    mentions?: string[];
    parentCommentId?: string;
}

interface ApprovalRequestBody {
    requestedBy: string;
    approvers: { userId: string; userName: string; email: string }[];
}

interface ApprovalDecisionBody {
    approvalId: string;
    userId: string;
    decision: 'approved' | 'rejected';
    comment?: string;
}

interface PresenceBody {
    userId: string;
    userName: string;
    cursor?: { line: number; column: number };
}

type RequestBody =
    | { action: 'addCollaborator' } & CollaboratorBody
    | { action: 'addComment' } & CommentBody
    | { action: 'requestApproval' } & ApprovalRequestBody
    | { action: 'processApproval' } & ApprovalDecisionBody
    | { action: 'updatePresence' } & PresenceBody;

// POST /api/rfqs/[id]/collaboration - Perform collaboration actions
export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    try {
        const { id: rfqId } = await context.params;
        const body = await request.json() as RequestBody;
        const { action } = body;

        switch (action) {
            case 'addCollaborator': {
                const { userId, name, email, role, addedBy } = body as { action: 'addCollaborator' } & CollaboratorBody;
                await rfqCollaborationService.addCollaborator(
                    rfqId,
                    { userId, name, email, role, addedBy },
                    addedBy
                );
                return NextResponse.json({ success: true, message: 'Collaborator added' });
            }

            case 'addComment': {
                const { userId, userName, content, mentions = [], parentCommentId } = body as { action: 'addComment' } & CommentBody;
                const comment = await rfqCollaborationService.addComment({
                    rfqId,
                    userId,
                    userName,
                    content,
                    mentions,
                    parentCommentId,
                });
                return NextResponse.json(comment, { status: 201 });
            }

            case 'requestApproval': {
                const { requestedBy, approvers } = body as { action: 'requestApproval' } & ApprovalRequestBody;
                const approval = await rfqCollaborationService.requestApproval(rfqId, requestedBy, approvers);
                return NextResponse.json(approval, { status: 201 });
            }

            case 'processApproval': {
                const { approvalId, userId, decision, comment } = body as { action: 'processApproval' } & ApprovalDecisionBody;
                const approval = await rfqCollaborationService.processApprovalDecision(
                    approvalId,
                    userId,
                    decision,
                    comment
                );
                return NextResponse.json(approval);
            }

            case 'updatePresence': {
                const { userId, userName, cursor } = body as { action: 'updatePresence' } & PresenceBody;
                await rfqCollaborationService.updatePresence(rfqId, userId, userName, cursor);
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error processing collaboration action:', error);
        return NextResponse.json(
            { error: 'Failed to process collaboration action' },
            { status: 500 }
        );
    }
}
