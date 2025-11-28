/**
 * Teams API
 *
 * Team members, roles, and permissions management
 */
import { NextRequest, NextResponse } from 'next/server';
import mongoose, { Schema, Document, Model } from 'mongoose';
import dbConnect from '../../../lib/mongodb';

interface IMember {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'manager' | 'member' | 'viewer';
    permissions: string[];
    status: 'active' | 'pending' | 'suspended';
    invitedAt: Date;
    joinedAt?: Date;
    invitedBy: string;
    lastActive?: Date;
}

interface ITeam extends Document {
    companyId: string;
    companyName: string;
    ownerId: string;
    members: IMember[];
    invitationCode?: string;
    createdAt: Date;
    updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
    companyId: { type: String, required: true, unique: true },
    companyName: { type: String, required: true },
    ownerId: { type: String, required: true },
    members: [
        {
            userId: { type: String },
            email: { type: String, required: true },
            name: { type: String },
            role: {
                type: String,
                enum: ['admin', 'manager', 'member', 'viewer'],
                default: 'member',
            },
            permissions: [{ type: String }],
            status: {
                type: String,
                enum: ['active', 'pending', 'suspended'],
                default: 'pending',
            },
            invitedAt: { type: Date, default: Date.now },
            joinedAt: { type: Date },
            invitedBy: { type: String },
            lastActive: { type: Date },
        },
    ],
    invitationCode: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

const Team: Model<ITeam> =
    mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);

// Default permissions by role
const rolePermissions: Record<string, string[]> = {
    admin: [
        'manage_team',
        'manage_billing',
        'manage_settings',
        'manage_integrations',
        'view_analytics',
        'manage_rfqs',
        'manage_orders',
        'manage_products',
        'view_all',
    ],
    manager: [
        'view_analytics',
        'manage_rfqs',
        'manage_orders',
        'manage_products',
        'view_all',
    ],
    member: ['manage_rfqs', 'manage_orders', 'view_all'],
    viewer: ['view_all'],
};

// Generate invitation code
function generateInviteCode(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET - Fetch team
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId');
        const userId = searchParams.get('userId');
        const invitationCode = searchParams.get('invitationCode');

        // Lookup team by invitation code
        if (invitationCode) {
            const team = await Team.findOne({ invitationCode }).lean();
            if (!team) {
                return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 });
            }
            return NextResponse.json({
                companyId: team.companyId,
                companyName: team.companyName,
                memberCount: team.members.filter((m) => m.status === 'active').length,
            });
        }

        if (!companyId && !userId) {
            return NextResponse.json(
                { error: 'companyId or userId is required' },
                { status: 400 }
            );
        }

        // Find team
        let team;
        if (companyId) {
            team = await Team.findOne({ companyId }).lean();
        } else {
            team = await Team.findOne({ 'members.userId': userId }).lean();
        }

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Get member stats
        const stats = {
            total: team.members.length,
            active: team.members.filter((m) => m.status === 'active').length,
            pending: team.members.filter((m) => m.status === 'pending').length,
            admins: team.members.filter((m) => m.role === 'admin').length,
        };

        return NextResponse.json({
            team,
            stats,
        });
    } catch (error) {
        console.error('Error fetching team:', error);
        return NextResponse.json({ error: 'Failed to fetch team' }, { status: 500 });
    }
}

// POST - Create team or invite member
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { action, ...data } = body;

        if (action === 'create') {
            // Create a new team
            const { companyId, companyName, ownerId, ownerEmail, ownerName } = data;

            if (!companyId || !companyName || !ownerId) {
                return NextResponse.json(
                    { error: 'companyId, companyName, and ownerId are required' },
                    { status: 400 }
                );
            }

            // Check if team already exists
            const existingTeam = await Team.findOne({ companyId });
            if (existingTeam) {
                return NextResponse.json(
                    { error: 'Team already exists for this company' },
                    { status: 400 }
                );
            }

            const team = new Team({
                companyId,
                companyName,
                ownerId,
                invitationCode: generateInviteCode(),
                members: [
                    {
                        userId: ownerId,
                        email: ownerEmail,
                        name: ownerName || 'Owner',
                        role: 'admin',
                        permissions: rolePermissions.admin,
                        status: 'active',
                        invitedAt: new Date(),
                        joinedAt: new Date(),
                        invitedBy: ownerId,
                    },
                ],
            });

            await team.save();

            return NextResponse.json({
                success: true,
                team,
            });
        }

        if (action === 'invite') {
            // Invite a new member
            const { companyId, email, name, role, invitedBy } = data;

            if (!companyId || !email || !role) {
                return NextResponse.json(
                    { error: 'companyId, email, and role are required' },
                    { status: 400 }
                );
            }

            const team = await Team.findOne({ companyId });
            if (!team) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }

            // Check if already a member
            const existingMember = team.members.find((m) => m.email === email);
            if (existingMember) {
                return NextResponse.json(
                    { error: 'User is already a team member' },
                    { status: 400 }
                );
            }

            // Add new member
            team.members.push({
                userId: '',
                email,
                name: name || email.split('@')[0],
                role,
                permissions: rolePermissions[role] || [],
                status: 'pending',
                invitedAt: new Date(),
                invitedBy,
            });
            team.updatedAt = new Date();

            await team.save();

            return NextResponse.json({
                success: true,
                message: `Invitation sent to ${email}`,
                team,
            });
        }

        if (action === 'join') {
            // Accept invitation
            const { invitationCode, userId, email, name } = data;

            if (!invitationCode || !userId || !email) {
                return NextResponse.json(
                    { error: 'invitationCode, userId, and email are required' },
                    { status: 400 }
                );
            }

            const team = await Team.findOne({ invitationCode });
            if (!team) {
                return NextResponse.json({ error: 'Invalid invitation code' }, { status: 404 });
            }

            // Find pending member
            const member = team.members.find(
                (m) => m.email === email && m.status === 'pending'
            );
            if (!member) {
                return NextResponse.json(
                    { error: 'No pending invitation found for this email' },
                    { status: 404 }
                );
            }

            // Activate member
            member.userId = userId;
            member.name = name || member.name;
            member.status = 'active';
            member.joinedAt = new Date();
            team.updatedAt = new Date();

            await team.save();

            return NextResponse.json({
                success: true,
                message: 'Successfully joined the team',
                team,
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error with team action:', error);
        return NextResponse.json({ error: 'Failed to process team action' }, { status: 500 });
    }
}

// PATCH - Update member role/permissions
export async function PATCH(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        const { companyId, memberId, role, permissions, status } = body;

        if (!companyId || !memberId) {
            return NextResponse.json(
                { error: 'companyId and memberId are required' },
                { status: 400 }
            );
        }

        const team = await Team.findOne({ companyId });
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        const member = team.members.find((m) => m.userId === memberId);
        if (!member) {
            return NextResponse.json({ error: 'Member not found' }, { status: 404 });
        }

        // Update member
        if (role) {
            member.role = role;
            member.permissions = permissions || rolePermissions[role] || [];
        }
        if (permissions) {
            member.permissions = permissions;
        }
        if (status) {
            member.status = status;
        }

        team.updatedAt = new Date();
        await team.save();

        return NextResponse.json({
            success: true,
            team,
        });
    } catch (error) {
        console.error('Error updating team member:', error);
        return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
    }
}

// DELETE - Remove member or delete team
export async function DELETE(request: NextRequest) {
    try {
        await dbConnect();

        const searchParams = request.nextUrl.searchParams;
        const companyId = searchParams.get('companyId');
        const memberId = searchParams.get('memberId');

        if (!companyId) {
            return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
        }

        const team = await Team.findOne({ companyId });
        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // Remove specific member
        if (memberId) {
            // Can't remove owner
            if (memberId === team.ownerId) {
                return NextResponse.json(
                    { error: 'Cannot remove the team owner' },
                    { status: 400 }
                );
            }

            team.members = team.members.filter((m) => m.userId !== memberId);
            team.updatedAt = new Date();
            await team.save();

            return NextResponse.json({
                success: true,
                message: 'Member removed from team',
                team,
            });
        }

        // Delete entire team
        await Team.findOneAndDelete({ companyId });

        return NextResponse.json({
            success: true,
            message: 'Team deleted',
        });
    } catch (error) {
        console.error('Error removing from team:', error);
        return NextResponse.json({ error: 'Failed to remove from team' }, { status: 500 });
    }
}
