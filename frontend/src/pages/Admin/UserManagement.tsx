import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Mail,
  Phone,
  Building,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  Ban,
  Key,
  RefreshCw,
  Download,
  Eye,
  User,
  Crown,
  UserCog,
} from 'lucide-react';
import DashboardSidebar from '../../components/DashboardSidebar';

interface UserData {
  _id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  company?: string;
  phone?: string;
  location?: string;
  avatar?: string;
  lastLogin?: string;
  createdAt: string;
  verifiedAt?: string;
  permissions: string[];
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  suspendedUsers: number;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    role: '',
    status: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('buyer');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState<Partial<UserData>>({});

  useEffect(() => {
    const mockUsers: UserData[] = [
      {
        _id: '1',
        email: 'admin@greenchainz.com',
        name: 'System Admin',
        role: 'admin',
        status: 'active',
        company: 'GreenChainz',
        phone: '+1 (555) 000-0001',
        location: 'San Francisco, CA',
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        createdAt: new Date(Date.now() - 365 * 86400000).toISOString(),
        verifiedAt: new Date(Date.now() - 365 * 86400000).toISOString(),
        permissions: ['all'],
      },
      {
        _id: '2',
        email: 'john.buyer@construction.com',
        name: 'John Builder',
        role: 'buyer',
        status: 'active',
        company: 'Green Construction Co',
        phone: '+1 (555) 123-4567',
        location: 'Austin, TX',
        lastLogin: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 180 * 86400000).toISOString(),
        verifiedAt: new Date(Date.now() - 179 * 86400000).toISOString(),
        permissions: ['orders.create', 'orders.read', 'products.read', 'rfq.manage'],
      },
      {
        _id: '3',
        email: 'supplier@ecomaterials.com',
        name: 'Sarah Eco',
        role: 'supplier',
        status: 'active',
        company: 'EcoMaterials Inc',
        phone: '+1 (555) 234-5678',
        location: 'Portland, OR',
        lastLogin: new Date(Date.now() - 7200000).toISOString(),
        createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
        verifiedAt: new Date(Date.now() - 88 * 86400000).toISOString(),
        permissions: ['products.manage', 'orders.read', 'rfq.respond'],
      },
      {
        _id: '4',
        email: 'new.supplier@greenbuilders.com',
        name: 'Mike Green',
        role: 'supplier',
        status: 'pending',
        company: 'GreenBuilders Ltd',
        location: 'Seattle, WA',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        permissions: [],
      },
      {
        _id: '5',
        email: 'suspended@example.com',
        name: 'Problem User',
        role: 'buyer',
        status: 'suspended',
        company: 'Suspended Corp',
        lastLogin: new Date(Date.now() - 30 * 86400000).toISOString(),
        createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
        permissions: [],
      },
      {
        _id: '6',
        email: 'team@greenchainz.com',
        name: 'Team Member',
        role: 'team_member',
        status: 'active',
        company: 'GreenChainz',
        phone: '+1 (555) 000-0002',
        location: 'San Francisco, CA',
        lastLogin: new Date(Date.now() - 10800000).toISOString(),
        createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
        verifiedAt: new Date(Date.now() - 120 * 86400000).toISOString(),
        permissions: ['orders.read', 'products.read', 'reports.read'],
      },
      {
        _id: '7',
        email: 'ops@greenchainz.com',
        name: 'Operations Manager',
        role: 'operations',
        status: 'active',
        company: 'GreenChainz',
        phone: '+1 (555) 000-0003',
        location: 'New York, NY',
        lastLogin: new Date(Date.now() - 5400000).toISOString(),
        createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
        verifiedAt: new Date(Date.now() - 200 * 86400000).toISOString(),
        permissions: ['orders.manage', 'products.manage', 'users.read'],
      },
    ];

    setUsers(mockUsers);
    setStats({
      totalUsers: mockUsers.length,
      activeUsers: mockUsers.filter(u => u.status === 'active').length,
      pendingVerification: mockUsers.filter(u => u.status === 'pending').length,
      suspendedUsers: mockUsers.filter(u => u.status === 'suspended').length,
    });
    setLoading(false);
  }, []);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-purple-600" />;
      case 'operations':
        return <UserCog className="w-4 h-4 text-blue-600" />;
      case 'supplier':
        return <Building className="w-4 h-4 text-green-600" />;
      case 'buyer':
        return <User className="w-4 h-4 text-cyan-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-purple-100 text-purple-700',
      operations: 'bg-blue-100 text-blue-700',
      supplier: 'bg-green-100 text-green-700',
      buyer: 'bg-cyan-100 text-cyan-700',
      team_member: 'bg-gray-100 text-gray-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">
            <Ban className="w-3 h-3" />
            Suspended
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700">
            <XCircle className="w-3 h-3" />
            Inactive
          </span>
        );
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100">{status}</span>;
    }
  };

  const handleInvite = async () => {
    // Would call API here
    console.log('Inviting user:', { email: inviteEmail, role: inviteRole });
    setShowInviteModal(false);
    setInviteEmail('');
    setInviteRole('buyer');
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;
    // Would call API here
    console.log('Updating user:', editData);
    setShowEditModal(false);
    setEditData({});
  };

  const handleSuspendUser = (userId: string) => {
    // Would call API here
    console.log('Suspending user:', userId);
  };

  const handleResetPassword = (userId: string) => {
    // Would call API here
    console.log('Resetting password for:', userId);
  };

  const filteredUsers = users.filter(user => {
    if (filters.role && user.role !== filters.role) return false;
    if (filters.status && user.status !== filters.status) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.company?.toLowerCase().includes(query)
      );
    }
    return true;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">Manage users, roles, and permissions</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4" />
              Invite User
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Total Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Active Users</p>
              <p className="text-2xl font-bold">{stats.activeUsers}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-50 rounded-lg">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Pending Verification</p>
              <p className="text-2xl font-bold">{stats.pendingVerification}</p>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-red-50 rounded-lg">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">Suspended</p>
              <p className="text-2xl font-bold">{stats.suspendedUsers}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={filters.role}
                  onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="operations">Operations</option>
                  <option value="buyer">Buyer</option>
                  <option value="supplier">Supplier</option>
                  <option value="team_member">Team Member</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ role: '', status: '' })}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name, email, or company..."
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Last Login</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-semibold">
                            {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full ${getRoleBadge(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="capitalize">{user.role.replace('_', ' ')}</span>
                        </span>
                      </td>
                      <td className="py-4">
                        {getStatusBadge(user.status)}
                      </td>
                      <td className="py-4">
                        <span className="text-gray-600">{user.company || '-'}</span>
                      </td>
                      <td className="py-4 text-gray-500">
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setEditData(user);
                              setShowEditModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4 text-gray-500" />
                          </button>
                          <button
                            onClick={() => handleResetPassword(user._id)}
                            className="p-1.5 hover:bg-gray-100 rounded"
                            title="Reset Password"
                          >
                            <Key className="w-4 h-4 text-gray-500" />
                          </button>
                          {user.status === 'active' ? (
                            <button
                              onClick={() => handleSuspendUser(user._id)}
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Suspend User"
                            >
                              <Ban className="w-4 h-4 text-gray-500" />
                            </button>
                          ) : (
                            <button
                              className="p-1.5 hover:bg-gray-100 rounded"
                              title="Activate User"
                            >
                              <CheckCircle className="w-4 h-4 text-gray-500" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Invite New User</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  >
                    <option value="buyer">Buyer</option>
                    <option value="supplier">Supplier</option>
                    <option value="team_member">Team Member</option>
                    <option value="operations">Operations</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500 mb-2">Role Permissions</p>
                  <ul className="text-sm space-y-1">
                    {inviteRole === 'buyer' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Create and manage orders</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Browse products</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Submit RFQs</li>
                      </>
                    )}
                    {inviteRole === 'supplier' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Manage products</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Respond to RFQs</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> View orders</li>
                      </>
                    )}
                    {inviteRole === 'admin' && (
                      <>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> Full system access</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> User management</li>
                        <li className="flex items-center gap-2"><CheckCircle className="w-3 h-3 text-green-600" /> System configuration</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              <div className="p-6 border-t flex justify-end gap-3">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={!inviteEmail}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Send Invitation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b">
                <h2 className="text-lg font-semibold">Edit User</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={editData.role || ''}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="supplier">Supplier</option>
                      <option value="team_member">Team Member</option>
                      <option value="operations">Operations</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editData.status || ''}
                      onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={editData.company || ''}
                      onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={editData.location || ''}
                    onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-3">Account Info</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2">{new Date(selectedUser.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Verified:</span>
                      <span className="ml-2">
                        {selectedUser.verifiedAt 
                          ? new Date(selectedUser.verifiedAt).toLocaleDateString()
                          : 'Not verified'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t flex justify-between">
                <button
                  onClick={() => {/* Handle delete */}}
                  className="px-4 py-2 text-red-600 hover:text-red-800"
                >
                  Delete User
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditData({});
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateUser}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default UserManagement;
