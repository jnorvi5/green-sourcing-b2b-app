/**
 * Audit Log API Routes
 * 
 * Endpoints for:
 * - GET /api/audit - Search audit logs
 * - GET /api/audit?entityType=xxx&entityId=yyy - Get entity history
 * - GET /api/audit/stats - Get audit statistics
 * - GET /api/audit/security - Get security events
 */
import { NextRequest, NextResponse } from 'next/server';
import { auditLog, AuditAction, AuditSeverity } from '../../../lib/auditLogService';

export const dynamic = 'force-dynamic';

// GET - Search and retrieve audit logs
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');

        // Get stats
        if (type === 'stats') {
            const days = parseInt(searchParams.get('days') || '7');
            const stats = await auditLog.getStats(days);
            return NextResponse.json(stats);
        }

        // Get security events
        if (type === 'security') {
            const limit = parseInt(searchParams.get('limit') || '100');
            const startDate = searchParams.get('startDate');
            const events = await auditLog.getSecurityEvents(
                startDate ? new Date(startDate) : undefined,
                limit
            );
            return NextResponse.json({ events, count: events.length });
        }

        // Get failed operations
        if (type === 'failures') {
            const limit = parseInt(searchParams.get('limit') || '100');
            const failures = await auditLog.getFailedOperations(limit);
            return NextResponse.json({ failures, count: failures.length });
        }

        // Get entity history
        const entityType = searchParams.get('entityType');
        const entityId = searchParams.get('entityId');
        if (entityType && entityId) {
            const limit = parseInt(searchParams.get('limit') || '50');
            const history = await auditLog.getEntityHistory(entityType, entityId, limit);
            return NextResponse.json({ history, count: history.length });
        }

        // Get user activity
        const userId = searchParams.get('userId');
        if (userId) {
            const limit = parseInt(searchParams.get('limit') || '100');
            const skip = parseInt(searchParams.get('skip') || '0');
            const actions = searchParams.get('actions')?.split(',') as AuditAction[] | undefined;

            const activity = await auditLog.getUserActivity(userId, { limit, skip, actions });
            return NextResponse.json({ activity, count: activity.length });
        }

        // General search
        const action = searchParams.get('action') as AuditAction | null;
        const actorId = searchParams.get('actorId');
        const targetType = searchParams.get('targetType');
        const targetId = searchParams.get('targetId');
        const severity = searchParams.get('severity') as AuditSeverity | null;
        const success = searchParams.get('success');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const limit = parseInt(searchParams.get('limit') || '100');
        const skip = parseInt(searchParams.get('skip') || '0');

        const result = await auditLog.search({
            action: action || undefined,
            actorId: actorId || undefined,
            targetType: targetType || undefined,
            targetId: targetId || undefined,
            severity: severity || undefined,
            success: success !== null ? success === 'true' : undefined,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            limit,
            skip,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('Audit API Error:', error);
        return NextResponse.json({ error: 'Failed to retrieve audit logs' }, { status: 500 });
    }
}
