// lib/rfqCollaborationService.ts - RFQ Collaboration Service
import { getDb } from './mongodb';
import { ObjectId } from 'mongodb';

export interface RFQCollaborator {
    userId: string;
    name: string;
    email: string;
    role: 'owner' | 'editor' | 'viewer' | 'approver';
    addedAt: Date;
    addedBy: string;
}

export interface RFQComment {
    _id?: ObjectId;
    rfqId: string;
    userId: string;
    userName: string;
    content: string;
    mentions: string[];
    attachments?: string[];
    parentCommentId?: string;
    isResolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    reactions: { emoji: string; userId: string; userName: string }[];
}

export interface RFQActivity {
    _id?: ObjectId;
    rfqId: string;
    type: 'created' | 'updated' | 'status_changed' | 'bid_received' | 'bid_accepted' | 'bid_rejected' |
    'comment_added' | 'collaborator_added' | 'collaborator_removed' | 'document_attached' |
    'approval_requested' | 'approved' | 'rejected';
    userId: string;
    userName: string;
    description: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}

export interface RFQApproval {
    _id?: ObjectId;
    rfqId: string;
    requestedBy: string;
    requestedAt: Date;
    approvers: {
        userId: string;
        userName: string;
        email: string;
        status: 'pending' | 'approved' | 'rejected';
        comment?: string;
        decidedAt?: Date;
    }[];
    status: 'pending' | 'approved' | 'rejected';
    completedAt?: Date;
}

export interface RFQTemplate {
    _id?: ObjectId;
    name: string;
    description: string;
    category: string;
    fields: RFQTemplateField[];
    defaultCollaborators?: RFQCollaborator[];
    defaultApprovers?: string[];
    createdBy: string;
    organizationId: string;
    isPublic: boolean;
    usageCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface RFQTemplateField {
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'textarea' | 'file';
    required: boolean;
    options?: string[];
    defaultValue?: string | number;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        message?: string;
    };
}

export const rfqCollaborationService = {
    // Collaborator Management
    async addCollaborator(
        rfqId: string,
        collaborator: Omit<RFQCollaborator, 'addedAt'>,
        addedBy: string
    ): Promise<void> {
        const db = await getDb('greenchainz');
        const now = new Date();

        await db.collection('rfqs').updateOne(
            { _id: new ObjectId(rfqId) },
            {
                $push: {
                    collaborators: {
                        ...collaborator,
                        addedAt: now,
                        addedBy,
                    },
                },
                $set: { updatedAt: now },
            }
        );

        // Log activity
        await this.logActivity({
            rfqId,
            type: 'collaborator_added',
            userId: addedBy,
            userName: addedBy,
            description: `Added ${collaborator.name} as ${collaborator.role}`,
            metadata: { collaborator },
            timestamp: now,
        });
    },

    async removeCollaborator(rfqId: string, userId: string, removedBy: string): Promise<void> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const rfq = await db.collection('rfqs').findOne({ _id: new ObjectId(rfqId) });
        const collaborator = rfq?.collaborators?.find((c: RFQCollaborator) => c.userId === userId);

        await db.collection('rfqs').updateOne(
            { _id: new ObjectId(rfqId) },
            {
                $pull: { collaborators: { userId } },
                $set: { updatedAt: now },
            }
        );

        if (collaborator) {
            await this.logActivity({
                rfqId,
                type: 'collaborator_removed',
                userId: removedBy,
                userName: removedBy,
                description: `Removed ${collaborator.name} from collaborators`,
                timestamp: now,
            });
        }
    },

    async updateCollaboratorRole(
        rfqId: string,
        userId: string,
        newRole: RFQCollaborator['role'],
        updatedBy: string
    ): Promise<void> {
        const db = await getDb('greenchainz');

        await db.collection('rfqs').updateOne(
            { _id: new ObjectId(rfqId), 'collaborators.userId': userId },
            {
                $set: {
                    'collaborators.$.role': newRole,
                    updatedAt: new Date(),
                },
            }
        );
    },

    // Comments
    async addComment(comment: Omit<RFQComment, '_id' | 'createdAt' | 'updatedAt' | 'isResolved' | 'reactions'>): Promise<RFQComment> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const newComment: RFQComment = {
            ...comment,
            isResolved: false,
            reactions: [],
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('rfq_comments').insertOne(newComment);

        // Log activity
        await this.logActivity({
            rfqId: comment.rfqId,
            type: 'comment_added',
            userId: comment.userId,
            userName: comment.userName,
            description: 'Added a comment',
            metadata: { commentId: result.insertedId.toString() },
            timestamp: now,
        });

        // Handle mentions - send notifications
        if (comment.mentions.length > 0) {
            // In production, trigger notifications here
        }

        return { ...newComment, _id: result.insertedId };
    },

    async getComments(rfqId: string, options?: { parentCommentId?: string; includeResolved?: boolean }): Promise<RFQComment[]> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = { rfqId };

        if (options?.parentCommentId !== undefined) {
            query.parentCommentId = options.parentCommentId || { $exists: false };
        }

        if (!options?.includeResolved) {
            query.isResolved = false;
        }

        return db.collection('rfq_comments')
            .find(query)
            .sort({ createdAt: -1 })
            .toArray() as Promise<RFQComment[]>;
    },

    async resolveComment(commentId: string, userId: string): Promise<void> {
        const db = await getDb('greenchainz');

        await db.collection('rfq_comments').updateOne(
            { _id: new ObjectId(commentId) },
            {
                $set: {
                    isResolved: true,
                    resolvedBy: userId,
                    resolvedAt: new Date(),
                    updatedAt: new Date(),
                },
            }
        );
    },

    async addReaction(commentId: string, emoji: string, userId: string, userName: string): Promise<void> {
        const db = await getDb('greenchainz');

        // Remove existing reaction from same user on same emoji
        await db.collection('rfq_comments').updateOne(
            { _id: new ObjectId(commentId) },
            { $pull: { reactions: { emoji, userId } } }
        );

        // Add new reaction
        await db.collection('rfq_comments').updateOne(
            { _id: new ObjectId(commentId) },
            {
                $push: { reactions: { emoji, userId, userName } },
                $set: { updatedAt: new Date() },
            }
        );
    },

    // Activity Log
    async logActivity(activity: Omit<RFQActivity, '_id'>): Promise<void> {
        const db = await getDb('greenchainz');
        await db.collection('rfq_activities').insertOne(activity);
    },

    async getActivities(rfqId: string, limit = 50): Promise<RFQActivity[]> {
        const db = await getDb('greenchainz');
        return db.collection('rfq_activities')
            .find({ rfqId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray() as Promise<RFQActivity[]>;
    },

    // Approval Workflow
    async requestApproval(
        rfqId: string,
        requestedBy: string,
        approvers: { userId: string; userName: string; email: string }[]
    ): Promise<RFQApproval> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const approval: RFQApproval = {
            rfqId,
            requestedBy,
            requestedAt: now,
            approvers: approvers.map((a) => ({
                ...a,
                status: 'pending',
            })),
            status: 'pending',
        };

        const result = await db.collection('rfq_approvals').insertOne(approval);

        // Update RFQ status
        await db.collection('rfqs').updateOne(
            { _id: new ObjectId(rfqId) },
            {
                $set: {
                    approvalStatus: 'pending',
                    currentApprovalId: result.insertedId.toString(),
                    updatedAt: now,
                },
            }
        );

        // Log activity
        await this.logActivity({
            rfqId,
            type: 'approval_requested',
            userId: requestedBy,
            userName: requestedBy,
            description: `Requested approval from ${approvers.length} approvers`,
            metadata: { approvers: approvers.map((a) => a.userName) },
            timestamp: now,
        });

        return { ...approval, _id: result.insertedId };
    },

    async processApprovalDecision(
        approvalId: string,
        userId: string,
        decision: 'approved' | 'rejected',
        comment?: string
    ): Promise<RFQApproval | null> {
        const db = await getDb('greenchainz');
        const now = new Date();

        // Update the specific approver's decision
        await db.collection('rfq_approvals').updateOne(
            { _id: new ObjectId(approvalId), 'approvers.userId': userId },
            {
                $set: {
                    'approvers.$.status': decision,
                    'approvers.$.comment': comment,
                    'approvers.$.decidedAt': now,
                },
            }
        );

        // Get updated approval
        const approval = await db.collection('rfq_approvals').findOne({
            _id: new ObjectId(approvalId),
        }) as RFQApproval | null;

        if (!approval) return null;

        // Check if all approvers have decided
        const allDecided = approval.approvers.every((a) => a.status !== 'pending');
        const anyRejected = approval.approvers.some((a) => a.status === 'rejected');
        const allApproved = approval.approvers.every((a) => a.status === 'approved');

        if (allDecided || anyRejected) {
            const finalStatus = anyRejected ? 'rejected' : allApproved ? 'approved' : 'pending';

            await db.collection('rfq_approvals').updateOne(
                { _id: new ObjectId(approvalId) },
                {
                    $set: {
                        status: finalStatus,
                        completedAt: now,
                    },
                }
            );

            // Update RFQ
            await db.collection('rfqs').updateOne(
                { _id: new ObjectId(approval.rfqId) },
                {
                    $set: {
                        approvalStatus: finalStatus,
                        updatedAt: now,
                    },
                }
            );

            // Log activity
            await this.logActivity({
                rfqId: approval.rfqId,
                type: decision === 'approved' ? 'approved' : 'rejected',
                userId,
                userName: approval.approvers.find((a) => a.userId === userId)?.userName || userId,
                description: `${decision === 'approved' ? 'Approved' : 'Rejected'} the RFQ${comment ? `: ${comment}` : ''}`,
                timestamp: now,
            });
        }

        return db.collection('rfq_approvals').findOne({
            _id: new ObjectId(approvalId),
        }) as Promise<RFQApproval | null>;
    },

    async getApproval(rfqId: string): Promise<RFQApproval | null> {
        const db = await getDb('greenchainz');
        return db.collection('rfq_approvals').findOne(
            { rfqId },
            { sort: { requestedAt: -1 } }
        ) as Promise<RFQApproval | null>;
    },

    // Templates
    async createTemplate(template: Omit<RFQTemplate, '_id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<RFQTemplate> {
        const db = await getDb('greenchainz');
        const now = new Date();

        const newTemplate: RFQTemplate = {
            ...template,
            usageCount: 0,
            createdAt: now,
            updatedAt: now,
        };

        const result = await db.collection('rfq_templates').insertOne(newTemplate);
        return { ...newTemplate, _id: result.insertedId };
    },

    async getTemplates(organizationId: string, category?: string): Promise<RFQTemplate[]> {
        const db = await getDb('greenchainz');
        const query: Record<string, unknown> = {
            $or: [
                { organizationId },
                { isPublic: true },
            ],
        };

        if (category) query.category = category;

        return db.collection('rfq_templates')
            .find(query)
            .sort({ usageCount: -1, name: 1 })
            .toArray() as Promise<RFQTemplate[]>;
    },

    async useTemplate(templateId: string): Promise<RFQTemplate | null> {
        const db = await getDb('greenchainz');

        return db.collection('rfq_templates').findOneAndUpdate(
            { _id: new ObjectId(templateId) },
            {
                $inc: { usageCount: 1 },
                $set: { updatedAt: new Date() },
            },
            { returnDocument: 'after' }
        ) as Promise<RFQTemplate | null>;
    },

    // Real-time presence (for collaborative editing)
    async updatePresence(rfqId: string, userId: string, userName: string, cursor?: { line: number; column: number }): Promise<void> {
        const db = await getDb('greenchainz');
        const now = new Date();

        await db.collection('rfq_presence').updateOne(
            { rfqId, oduserId: userId },
            {
                $set: {
                    rfqId,
                    userId,
                    userName,
                    cursor,
                    lastSeen: now,
                },
            },
            { upsert: true }
        );
    },

    async getActiveUsers(rfqId: string): Promise<{ userId: string; userName: string; cursor?: { line: number; column: number } }[]> {
        const db = await getDb('greenchainz');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        return db.collection('rfq_presence')
            .find({
                rfqId,
                lastSeen: { $gte: fiveMinutesAgo },
            })
            .project({ userId: 1, userName: 1, cursor: 1, _id: 0 })
            .toArray() as Promise<{ userId: string; userName: string; cursor?: { line: number; column: number } }[]>;
    },

    // Analytics
    async getCollaborationStats(organizationId: string, dateRange: { start: Date; end: Date }): Promise<{
        totalRFQs: number;
        avgCollaboratorsPerRFQ: number;
        avgCommentsPerRFQ: number;
        approvalRate: number;
        avgTimeToApproval: number; // in hours
        topCollaborators: { userId: string; userName: string; contributions: number }[];
    }> {
        const db = await getDb('greenchainz');

        // Get RFQs in date range
        const rfqs = await db.collection('rfqs').find({
            organizationId,
            createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        }).toArray();

        const rfqIds = rfqs.map((r) => r._id.toString());

        // Get comments
        const comments = await db.collection('rfq_comments').find({
            rfqId: { $in: rfqIds },
        }).toArray();

        // Get approvals
        const approvals = await db.collection('rfq_approvals').find({
            rfqId: { $in: rfqIds },
        }).toArray();

        // Calculate stats
        const totalCollaborators = rfqs.reduce((sum, r) => sum + (r.collaborators?.length || 1), 0);
        const approvedCount = approvals.filter((a) => a.status === 'approved').length;

        // Calculate average time to approval
        const completedApprovals = approvals.filter((a) => a.completedAt);
        const totalApprovalTime = completedApprovals.reduce((sum, a) => {
            const requestedAt = new Date(a.requestedAt).getTime();
            const completedAt = new Date(a.completedAt).getTime();
            return sum + (completedAt - requestedAt);
        }, 0);
        const avgTimeToApproval = completedApprovals.length > 0
            ? (totalApprovalTime / completedApprovals.length) / (1000 * 60 * 60) // Convert to hours
            : 0;

        // Get top collaborators
        const collaboratorCounts: Record<string, { userName: string; count: number }> = {};
        for (const rfq of rfqs) {
            for (const collab of rfq.collaborators || []) {
                if (!collaboratorCounts[collab.userId]) {
                    collaboratorCounts[collab.userId] = { userName: collab.name, count: 0 };
                }
                collaboratorCounts[collab.userId].count++;
            }
        }

        const topCollaborators = Object.entries(collaboratorCounts)
            .map(([userId, data]) => ({
                userId,
                userName: data.userName,
                contributions: data.count,
            }))
            .sort((a, b) => b.contributions - a.contributions)
            .slice(0, 5);

        return {
            totalRFQs: rfqs.length,
            avgCollaboratorsPerRFQ: rfqs.length > 0 ? totalCollaborators / rfqs.length : 0,
            avgCommentsPerRFQ: rfqs.length > 0 ? comments.length / rfqs.length : 0,
            approvalRate: approvals.length > 0 ? (approvedCount / approvals.length) * 100 : 0,
            avgTimeToApproval,
            topCollaborators,
        };
    },
};

export default rfqCollaborationService;
