/**
 * Team Management Page
 *
 * Manage team members, roles, and permissions
 */
import { useState } from 'react';
import {
    UserPlusIcon,
    PencilIcon,
    TrashIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    ClockIcon,
    CheckCircleIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    ChevronDownIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

interface TeamMember {
    id: string;
    name: string;
    email: string;
    role: 'owner' | 'admin' | 'manager' | 'member' | 'viewer';
    status: 'active' | 'pending' | 'inactive';
    avatar?: string;
    lastActive?: string;
    joinedAt: string;
    permissions: string[];
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    sentAt: string;
    expiresAt: string;
}

const MOCK_MEMBERS: TeamMember[] = [
    {
        id: 'm1',
        name: 'John Smith',
        email: 'john.smith@company.com',
        role: 'owner',
        status: 'active',
        lastActive: '2024-01-25T10:30:00Z',
        joinedAt: '2023-06-15',
        permissions: ['all'],
    },
    {
        id: 'm2',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@company.com',
        role: 'admin',
        status: 'active',
        lastActive: '2024-01-24T16:45:00Z',
        joinedAt: '2023-08-20',
        permissions: ['manage_team', 'manage_products', 'manage_orders', 'view_analytics'],
    },
    {
        id: 'm3',
        name: 'Michael Chen',
        email: 'michael.chen@company.com',
        role: 'manager',
        status: 'active',
        lastActive: '2024-01-25T09:15:00Z',
        joinedAt: '2023-10-05',
        permissions: ['manage_products', 'manage_orders', 'view_analytics'],
    },
    {
        id: 'm4',
        name: 'Emily Davis',
        email: 'emily.davis@company.com',
        role: 'member',
        status: 'active',
        lastActive: '2024-01-23T14:20:00Z',
        joinedAt: '2023-11-12',
        permissions: ['view_products', 'create_quotes', 'view_orders'],
    },
    {
        id: 'm5',
        name: 'Robert Williams',
        email: 'robert.williams@company.com',
        role: 'viewer',
        status: 'inactive',
        joinedAt: '2023-12-01',
        permissions: ['view_products', 'view_orders'],
    },
];

const MOCK_INVITATIONS: Invitation[] = [
    {
        id: 'i1',
        email: 'new.member@company.com',
        role: 'member',
        sentAt: '2024-01-24',
        expiresAt: '2024-01-31',
    },
];

const ROLES = [
    {
        value: 'admin',
        label: 'Admin',
        description: 'Full access except owner actions',
        color: 'text-purple-400',
    },
    {
        value: 'manager',
        label: 'Manager',
        description: 'Manage products, orders, and view analytics',
        color: 'text-blue-400',
    },
    {
        value: 'member',
        label: 'Member',
        description: 'Create quotes and manage assigned orders',
        color: 'text-emerald-400',
    },
    {
        value: 'viewer',
        label: 'Viewer',
        description: 'View-only access to products and orders',
        color: 'text-gray-400',
    },
];

export function TeamManagement() {
    const [members, setMembers] = useState<TeamMember[]>(MOCK_MEMBERS);
    const [invitations, setInvitations] = useState<Invitation[]>(MOCK_INVITATIONS);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterRole, setFilterRole] = useState<string>('all');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

    // Invite form state
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('member');

    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            searchQuery === '' ||
            member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            member.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = filterRole === 'all' || member.role === filterRole;
        return matchesSearch && matchesRole;
    });

    const handleInvite = () => {
        if (!inviteEmail.trim()) return;

        const newInvitation: Invitation = {
            id: `i${Date.now()}`,
            email: inviteEmail,
            role: inviteRole,
            sentAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };

        setInvitations([...invitations, newInvitation]);
        setInviteEmail('');
        setInviteRole('member');
        setShowInviteModal(false);
    };

    const handleRemoveMember = (memberId: string) => {
        setMembers(members.filter((m) => m.id !== memberId));
    };

    const handleCancelInvitation = (invitationId: string) => {
        setInvitations(invitations.filter((i) => i.id !== invitationId));
    };

    const handleUpdateRole = (memberId: string, newRole: TeamMember['role']) => {
        setMembers(
            members.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
        setShowEditModal(false);
        setSelectedMember(null);
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'owner':
                return 'bg-yellow-900/50 text-yellow-400 border-yellow-800';
            case 'admin':
                return 'bg-purple-900/50 text-purple-400 border-purple-800';
            case 'manager':
                return 'bg-blue-900/50 text-blue-400 border-blue-800';
            case 'member':
                return 'bg-emerald-900/50 text-emerald-400 border-emerald-800';
            default:
                return 'bg-gray-700 text-gray-400 border-gray-600';
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                        <CheckCircleIcon className="w-3.5 h-3.5" />
                        Active
                    </span>
                );
            case 'pending':
                return (
                    <span className="flex items-center gap-1 text-xs text-yellow-400">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Pending
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                        <XCircleIcon className="w-3.5 h-3.5" />
                        Inactive
                    </span>
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Team Management</h1>
                        <p className="text-gray-400">Manage your team members and permissions</p>
                    </div>
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                    >
                        <UserPlusIcon className="w-5 h-5" />
                        Invite Member
                    </button>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-emerald-900/50 flex items-center justify-center">
                                <UserGroupIcon className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{members.length}</p>
                                <p className="text-sm text-gray-500">Team Members</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center">
                                <CheckCircleIcon className="w-5 h-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{members.filter((m) => m.status === 'active').length}</p>
                                <p className="text-sm text-gray-500">Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-yellow-900/50 flex items-center justify-center">
                                <ClockIcon className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{invitations.length}</p>
                                <p className="text-sm text-gray-500">Pending Invites</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-purple-900/50 flex items-center justify-center">
                                <ShieldCheckIcon className="w-5 h-5 text-purple-400" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">{members.filter((m) => m.role === 'admin').length + 1}</p>
                                <p className="text-sm text-gray-500">Admins</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search team members..."
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                    >
                        <option value="all">All Roles</option>
                        <option value="owner">Owner</option>
                        <option value="admin">Admin</option>
                        <option value="manager">Manager</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>

                {/* Team Members Table */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden mb-8">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Member</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Role</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Status</th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-gray-400">Last Active</th>
                                <th className="text-right px-6 py-4 text-sm font-medium text-gray-400">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMembers.map((member) => (
                                <tr key={member.id} className="border-b border-gray-700 last:border-0">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 font-medium">
                                                {member.name.split(' ').map((n) => n[0]).join('')}
                                            </div>
                                            <div>
                                                <p className="font-medium">{member.name}</p>
                                                <p className="text-sm text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                                member.role
                                            )}`}
                                        >
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(member.status)}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {member.lastActive
                                            ? new Date(member.lastActive).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })
                                            : 'Never'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {member.role !== 'owner' && (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedMember(member);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <PencilIcon className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveMember(member.id)}
                                                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pending Invitations */}
                {invitations.length > 0 && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-700">
                            <h3 className="font-bold">Pending Invitations</h3>
                        </div>
                        <div className="divide-y divide-gray-700">
                            {invitations.map((invitation) => (
                                <div
                                    key={invitation.id}
                                    className="flex items-center justify-between px-6 py-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                                            <EnvelopeIcon className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{invitation.email}</p>
                                            <p className="text-sm text-gray-500">
                                                Sent {new Date(invitation.sentAt).toLocaleDateString()} • Expires{' '}
                                                {new Date(invitation.expiresAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadgeColor(
                                                invitation.role
                                            )}`}
                                        >
                                            {invitation.role.charAt(0).toUpperCase() + invitation.role.slice(1)}
                                        </span>
                                        <button
                                            onClick={() => handleCancelInvitation(invitation.id)}
                                            className="text-sm text-red-400 hover:underline"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Invite Team Member</h2>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email Address</label>
                                <input
                                    type="email"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com"
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Role</label>
                                <div className="space-y-2">
                                    {ROLES.map((role) => (
                                        <label
                                            key={role.value}
                                            className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${inviteRole === role.value
                                                    ? 'bg-emerald-900/20 border-emerald-500'
                                                    : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="role"
                                                value={role.value}
                                                checked={inviteRole === role.value}
                                                onChange={(e) => setInviteRole(e.target.value)}
                                                className="mt-1"
                                            />
                                            <div>
                                                <p className={`font-medium ${role.color}`}>{role.label}</p>
                                                <p className="text-sm text-gray-500">{role.description}</p>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowInviteModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={!inviteEmail.trim()}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                            >
                                Send Invite
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Role Modal */}
            {showEditModal && selectedMember && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Edit Role</h2>
                            <p className="text-gray-400 text-sm mt-1">{selectedMember.name}</p>
                        </div>

                        <div className="p-6">
                            <div className="space-y-2">
                                {ROLES.map((role) => (
                                    <label
                                        key={role.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedMember.role === role.value
                                                ? 'bg-emerald-900/20 border-emerald-500'
                                                : 'bg-gray-900 border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="edit-role"
                                            value={role.value}
                                            checked={selectedMember.role === role.value}
                                            onChange={(e) =>
                                                setSelectedMember({
                                                    ...selectedMember,
                                                    role: e.target.value as TeamMember['role'],
                                                })
                                            }
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className={`font-medium ${role.color}`}>{role.label}</p>
                                            <p className="text-sm text-gray-500">{role.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedMember(null);
                                }}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleUpdateRole(selectedMember.id, selectedMember.role)}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeamManagement;
