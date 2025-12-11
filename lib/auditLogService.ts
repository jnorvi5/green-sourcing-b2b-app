/**
 * Audit Log Service
 * 
 * Track all platform activity for:
 * - Security & compliance
 * - User activity tracking
 * - Change history
 * - Debugging
 */
import { getAnalyticsDB } from './databases';
import mongoose, { Schema, Document, Model } from 'mongoose';

// ==================== Types ====================
export type AuditAction =
    // Auth
    | 'auth.login'
    | 'auth.logout'
    | 'auth.login_failed'
    | 'auth.password_changed'
    | 'auth.password_reset'
    | 'auth.mfa_enabled'
    | 'auth.mfa_disabled'
    // User
    | 'user.created'
    | 'user.updated'
    | 'user.deleted'
    | 'user.role_changed'
    | 'user.email_verified'
    // Product
    | 'product.created'
    | 'product.updated'
    | 'product.deleted'
    | 'product.published'
    | 'product.unpublished'
    | 'product.approved'
    | 'product.rejected'
    // Order
    | 'order.created'
    | 'order.updated'
    | 'order.cancelled'
    | 'order.shipped'
    | 'order.delivered'
    | 'order.refunded'
    // RFQ
    | 'rfq.created'
    | 'rfq.updated'
    | 'rfq.cancelled'
    | 'rfq.quote_submitted'
    | 'rfq.awarded'
    // Payment
    | 'payment.initiated'
    | 'payment.completed'
    | 'payment.failed'
    | 'payment.refunded'
    // Invoice
    | 'invoice.created'
    | 'invoice.sent'
    | 'invoice.paid'
    | 'invoice.voided'
    // Settings
    | 'settings.updated'
    | 'settings.api_key_created'
    | 'settings.api_key_revoked'
    // Team
    | 'team.member_added'
    | 'team.member_removed'
    | 'team.role_updated'
    // System
    | 'system.maintenance'
    | 'system.config_changed'
    | 'system.export_created'
    | 'system.import_completed';

export type AuditSeverity = 'info' | 'warning' | 'critical';

// ==================== Interface ====================
export interface IAuditLog extends Document {
    action: AuditAction;
    severity: AuditSeverity;
    actor: {
        userId?: mongoose.Types.ObjectId;
        email?: string;
        name?: string;
        role?: string;
        ip?: string;
        userAgent?: string;
    };
    target: {
        type: string; // 'user', 'product', 'order', etc.
        id?: string;
        name?: string;
    };
    changes?: {
        before?: Record<string, unknown>;
        after?: Record<string, unknown>;
    };
    metadata?: Record<string, unknown>;
    success: boolean;
    error?: string;
    duration?: number; // ms
    requestId?: string;
    createdAt: Date;
}

// ==================== Schema ====================
const AuditLogSchema = new Schema<IAuditLog>(
    {
        action: {
            type: String,
            required: true,
            index: true,
        },
        severity: {
            type: String,
            enum: ['info', 'warning', 'critical'],
            default: 'info',
            index: true,
        },
        actor: {
            userId: { type: Schema.Types.ObjectId, index: true },
            email: String,
            name: String,
            role: String,
            ip: String,
            userAgent: String,
        },
        target: {
            type: { type: String, index: true },
            id: { type: String, index: true },
            name: String,
        },
        changes: {
            before: Schema.Types.Mixed,
            after: Schema.Types.Mixed,
        },
        metadata: Schema.Types.Mixed,
        success: { type: Boolean, default: true, index: true },
        error: String,
        duration: Number,
        requestId: { type: String, index: true },
    },
    {
        timestamps: { createdAt: true, updatedAt: false },
    }
);

// Compound indexes for common queries
AuditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
AuditLogSchema.index({ 'target.type': 1, 'target.id': 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ createdAt: -1 });

// TTL index - auto-delete after 2 years
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

// ==================== Model Getter ====================
let AuditLogModel: Model<IAuditLog> | null = null;

export async function getAuditLogModel(): Promise<Model<IAuditLog>> {
    const db = await getAnalyticsDB();

    if (!AuditLogModel) {
        AuditLogModel = db.model<IAuditLog>('AuditLog', AuditLogSchema);
    }

    return AuditLogModel;
}

// ==================== Audit Log Service ====================
export class AuditLogService {

    /**
     * Log an action
     */
    async log(params: {
        action: AuditAction;
        actor?: {
            userId?: string;
            email?: string;
            name?: string;
            role?: string;
            ip?: string;
            userAgent?: string;
        };
        target?: {
            type: string;
            id?: string;
            name?: string;
        };
        changes?: {
            before?: Record<string, unknown>;
            after?: Record<string, unknown>;
        };
        metadata?: Record<string, unknown>;
        success?: boolean;
        error?: string;
        duration?: number;
        requestId?: string;
    }): Promise<IAuditLog> {
        const AuditLog = await getAuditLogModel();

        const severity = this.getSeverity(params.action, params.success ?? true);

        const log = new AuditLog({
            action: params.action,
            severity,
            actor: params.actor ? {
                ...params.actor,
                userId: params.actor.userId ? new mongoose.Types.ObjectId(params.actor.userId) : undefined,
            } : undefined,
            target: params.target,
            changes: params.changes,
            metadata: params.metadata,
            success: params.success ?? true,
            error: params.error,
            duration: params.duration,
            requestId: params.requestId,
        });

        await log.save();

        // Log critical events to console for immediate visibility
        if (severity === 'critical') {
            console.warn(`🚨 CRITICAL AUDIT: ${params.action}`, {
                actor: params.actor?.email || params.actor?.userId,
                target: params.target,
                error: params.error,
            });
        }

        return log;
    }

    /**
     * Convenience method for logging with request context
     */
    async logRequest(
        action: AuditAction,
        request: { headers: Headers; url: string },
        params: {
            userId?: string;
            target?: { type: string; id?: string; name?: string };
            changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
            metadata?: Record<string, unknown>;
            success?: boolean;
            error?: string;
        }
    ): Promise<IAuditLog> {
        const ip = request.headers.get('x-forwarded-for') ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        const requestId = request.headers.get('x-request-id') || undefined;

        return this.log({
            action,
            actor: {
                userId: params.userId,
                ip,
                userAgent,
            },
            target: params.target,
            changes: params.changes,
            metadata: params.metadata,
            success: params.success,
            error: params.error,
            requestId,
        });
    }

    /**
     * Search audit logs
     */
    async search(params: {
        action?: AuditAction | AuditAction[];
        actorId?: string;
        targetType?: string;
        targetId?: string;
        severity?: AuditSeverity;
        success?: boolean;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
        skip?: number;
    }): Promise<{ logs: IAuditLog[]; total: number }> {
        const AuditLog = await getAuditLogModel();

        const query: Record<string, unknown> = {};

        if (params.action) {
            query['action'] = Array.isArray(params.action) ? { $in: params.action } : params.action;
        }
        if (params.actorId) {
            query['actor.userId'] = new mongoose.Types.ObjectId(params.actorId);
        }
        if (params.targetType) {
            query['target.type'] = params.targetType;
        }
        if (params.targetId) {
            query['target.id'] = params.targetId;
        }
        if (params.severity) {
            query['severity'] = params.severity;
        }
        if (params.success !== undefined) {
            query['success'] = params.success;
        }
        if (params.startDate || params.endDate) {
            query['createdAt'] = {};
            if (params.startDate) (query['createdAt'] as Record<string, Date>)['$gte'] = params.startDate;
            if (params.endDate) (query['createdAt'] as Record<string, Date>)['$lte'] = params.endDate;
        }

        const [logs, total] = await Promise.all([
            AuditLog.find(query)
                .sort({ createdAt: -1 })
                .skip(params.skip || 0)
                .limit(params.limit || 100)
                .lean(),
            AuditLog.countDocuments(query),
        ]);

        return { logs: logs as unknown as IAuditLog[], total };
    }

    /**
     * Get activity for a specific entity
     */
    async getEntityHistory(
        entityType: string,
        entityId: string,
        limit: number = 50
    ): Promise<IAuditLog[]> {
        const AuditLog = await getAuditLogModel();

        const logs = await AuditLog.find({
            'target.type': entityType,
            'target.id': entityId,
        })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return logs as unknown as IAuditLog[];
    }

    /**
     * Get activity for a specific user
     */
    async getUserActivity(
        userId: string,
        options?: {
            limit?: number;
            skip?: number;
            actions?: AuditAction[];
        }
    ): Promise<IAuditLog[]> {
        const AuditLog = await getAuditLogModel();

        const query: Record<string, unknown> = {
            'actor.userId': new mongoose.Types.ObjectId(userId),
        };

        if (options?.actions) {
            query['action'] = { $in: options.actions };
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(options?.skip || 0)
            .limit(options?.limit || 100)
            .lean();
        return logs as unknown as IAuditLog[];
    }

    /**
     * Get security events (failed logins, permission changes, etc.)
     */
    async getSecurityEvents(
        startDate?: Date,
        limit: number = 100
    ): Promise<IAuditLog[]> {
        const AuditLog = await getAuditLogModel();

        const securityActions: AuditAction[] = [
            'auth.login_failed',
            'auth.password_changed',
            'auth.password_reset',
            'auth.mfa_enabled',
            'auth.mfa_disabled',
            'user.role_changed',
            'settings.api_key_created',
            'settings.api_key_revoked',
            'team.member_added',
            'team.member_removed',
            'team.role_updated',
        ];

        const query: Record<string, unknown> = {
            action: { $in: securityActions },
        };

        if (startDate) {
            query['createdAt'] = { $gte: startDate };
        }

        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return logs as unknown as IAuditLog[];
    }

    /**
     * Get failed operations
     */
    async getFailedOperations(limit: number = 100): Promise<IAuditLog[]> {
        const AuditLog = await getAuditLogModel();

        const logs = await AuditLog.find({ success: false })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
        return logs as unknown as IAuditLog[];
    }

    /**
     * Get audit statistics
     */
    async getStats(days: number = 7): Promise<{
        totalEvents: number;
        byAction: Record<string, number>;
        bySeverity: Record<string, number>;
        failureRate: number;
    }> {
        const AuditLog = await getAuditLogModel();

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const [totalEvents, byAction, bySeverity, failures] = await Promise.all([
            AuditLog.countDocuments({ createdAt: { $gte: startDate } }),
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$action', count: { $sum: 1 } } },
            ]),
            AuditLog.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                { $group: { _id: '$severity', count: { $sum: 1 } } },
            ]),
            AuditLog.countDocuments({ createdAt: { $gte: startDate }, success: false }),
        ]);

        return {
            totalEvents,
            byAction: Object.fromEntries(byAction.map(a => [a._id, a.count])),
            bySeverity: Object.fromEntries(bySeverity.map(s => [s._id, s.count])),
            failureRate: totalEvents > 0 ? (failures / totalEvents) * 100 : 0,
        };
    }

    // ==================== Private Methods ====================

    private getSeverity(action: AuditAction, success: boolean): AuditSeverity {
        // Failed auth attempts are critical
        if (!success && action.startsWith('auth.')) return 'critical';

        // Certain actions are always warnings
        const warningActions: AuditAction[] = [
            'auth.password_changed',
            'auth.password_reset',
            'user.role_changed',
            'settings.api_key_created',
            'settings.api_key_revoked',
            'order.cancelled',
            'order.refunded',
            'payment.failed',
        ];
        if (warningActions.includes(action)) return 'warning';

        // Critical actions
        const criticalActions: AuditAction[] = [
            'user.deleted',
            'auth.mfa_disabled',
            'system.config_changed',
        ];
        if (criticalActions.includes(action)) return 'critical';

        return 'info';
    }
}

// Singleton instance
export const auditLog = new AuditLogService();

export default auditLog;
