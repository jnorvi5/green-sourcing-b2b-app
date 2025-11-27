import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Key,
    LogIn,
    LogOut,
    Settings,
    RefreshCw,
    Download,
    Filter,
    Search,
    ChevronDown,
    Eye,
    AlertCircle,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface AuditLog {
    _id: string;
    action: string;
    severity: 'info' | 'warning' | 'critical';
    actor: {
        userId?: string;
        email?: string;
        name?: string;
        role?: string;
        ip?: string;
    };
    target: {
        type: string;
        id?: string;
        name?: string;
    };
    success: boolean;
    error?: string;
    createdAt: string;
}

interface AuditStats {
    totalEvents: number;
    byAction: Record<string, number>;
    bySeverity: Record<string, number>;
    failureRate: number;
}

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [stats, setStats] = useState<AuditStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        severity: '',
        action: '',
        success: '',
        days: '7',
    });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);

            const params = new URLSearchParams();
            if (filters.severity) params.append('severity', filters.severity);
            if (filters.action) params.append('action', filters.action);
            if (filters.success) params.append('success', filters.success);

            const [logsRes, statsRes] = await Promise.all([
                fetch(`/api/audit?${params.toString()}`),
                fetch(`/api/audit?type=stats&days=${filters.days}`),
            ]);

            if (logsRes.ok) {
                const data = await logsRes.json();
                setLogs(data.logs || []);
            }

            if (statsRes.ok) {
                const data = await statsRes.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const getActionIcon = (action: string) => {
        if (action.includes('login')) return <LogIn className="w-4 h-4" />;
        if (action.includes('logout')) return <LogOut className="w-4 h-4" />;
        if (action.includes('password') || action.includes('mfa')) return <Key className="w-4 h-4" />;
        if (action.includes('settings') || action.includes('config')) return <Settings className="w-4 h-4" />;
        if (action.includes('user')) return <User className="w-4 h-4" />;
        return <Shield className="w-4 h-4" />;
    };

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case 'critical':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'warning':
                return 'bg-amber-100 text-amber-700 border-amber-200';
            default:
                return 'bg-blue-100 text-blue-700 border-blue-200';
        }
    };

    const formatAction = (action: string) => {
        return action
            .replace(/\./g, ' → ')
            .replace(/_/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const filteredLogs = logs.filter(log => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            log.action.toLowerCase().includes(query) ||
            log.actor.email?.toLowerCase().includes(query) ||
            log.actor.name?.toLowerCase().includes(query) ||
            log.target.type.toLowerCase().includes(query) ||
            log.target.name?.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
                        <p className="text-gray-500 mt-1">Track all platform activity and security events</p>
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
                        <button
                            onClick={fetchData}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
                            <Download className="w-4 h-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-lg">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Events</p>
                                    <p className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-50 rounded-lg">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Success Rate</p>
                                    <p className="text-2xl font-bold">{(100 - stats.failureRate).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-amber-50 rounded-lg">
                                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Warnings</p>
                                    <p className="text-2xl font-bold">{stats.bySeverity.warning || 0}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-red-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Critical</p>
                                    <p className="text-2xl font-bold">{stats.bySeverity.critical || 0}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                                <select
                                    value={filters.severity}
                                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All</option>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select
                                    value={filters.success}
                                    onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All</option>
                                    <option value="true">Success</option>
                                    <option value="false">Failed</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time Period</label>
                                <select
                                    value={filters.days}
                                    onChange={(e) => setFilters({ ...filters, days: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="1">Last 24 hours</option>
                                    <option value="7">Last 7 days</option>
                                    <option value="30">Last 30 days</option>
                                    <option value="90">Last 90 days</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                                <select
                                    value={filters.action}
                                    onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2"
                                >
                                    <option value="">All Actions</option>
                                    <option value="auth.login">Login</option>
                                    <option value="auth.logout">Logout</option>
                                    <option value="auth.login_failed">Failed Login</option>
                                    <option value="user.created">User Created</option>
                                    <option value="order.created">Order Created</option>
                                    <option value="payment.completed">Payment</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="flex-1 relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search logs by action, user, or target..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Logs Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : filteredLogs.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>No audit logs found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-3 font-medium">Action</th>
                                        <th className="pb-3 font-medium">User</th>
                                        <th className="pb-3 font-medium">Target</th>
                                        <th className="pb-3 font-medium">Status</th>
                                        <th className="pb-3 font-medium">Severity</th>
                                        <th className="pb-3 font-medium">Time</th>
                                        <th className="pb-3 font-medium"></th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredLogs.map((log) => (
                                        <tr key={log._id} className="border-b last:border-0 hover:bg-gray-50">
                                            <td className="py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-gray-100 rounded">
                                                        {getActionIcon(log.action)}
                                                    </div>
                                                    <span className="font-medium">{formatAction(log.action)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div>
                                                    <p className="font-medium">{log.actor.name || log.actor.email || 'System'}</p>
                                                    {log.actor.ip && (
                                                        <p className="text-xs text-gray-500">{log.actor.ip}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <div>
                                                    <p className="capitalize">{log.target.type}</p>
                                                    {log.target.name && (
                                                        <p className="text-xs text-gray-500">{log.target.name}</p>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                {log.success ? (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="w-4 h-4" />
                                                        Success
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1 text-red-600">
                                                        <XCircle className="w-4 h-4" />
                                                        Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4">
                                                <span className={`px-2 py-1 text-xs rounded-full border ${getSeverityColor(log.severity)}`}>
                                                    {log.severity}
                                                </span>
                                            </td>
                                            <td className="py-4 text-gray-500">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    {new Date(log.createdAt).toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="py-4">
                                                <button
                                                    onClick={() => setSelectedLog(log)}
                                                    className="p-1.5 hover:bg-gray-100 rounded"
                                                >
                                                    <Eye className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Detail Modal */}
                {selectedLog && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="p-6 border-b">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold">Audit Log Details</h2>
                                    <button
                                        onClick={() => setSelectedLog(null)}
                                        className="p-1.5 hover:bg-gray-100 rounded"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-sm text-gray-500">Action</label>
                                    <p className="font-medium">{formatAction(selectedLog.action)}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm text-gray-500">Severity</label>
                                        <p className={`inline-block px-2 py-1 text-xs rounded-full border mt-1 ${getSeverityColor(selectedLog.severity)}`}>
                                            {selectedLog.severity}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm text-gray-500">Status</label>
                                        <p className={`font-medium ${selectedLog.success ? 'text-green-600' : 'text-red-600'}`}>
                                            {selectedLog.success ? 'Success' : 'Failed'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Actor</label>
                                    <div className="bg-gray-50 rounded-lg p-3 mt-1">
                                        <p><strong>Name:</strong> {selectedLog.actor.name || 'N/A'}</p>
                                        <p><strong>Email:</strong> {selectedLog.actor.email || 'N/A'}</p>
                                        <p><strong>Role:</strong> {selectedLog.actor.role || 'N/A'}</p>
                                        <p><strong>IP:</strong> {selectedLog.actor.ip || 'N/A'}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-500">Target</label>
                                    <div className="bg-gray-50 rounded-lg p-3 mt-1">
                                        <p><strong>Type:</strong> {selectedLog.target.type}</p>
                                        <p><strong>ID:</strong> {selectedLog.target.id || 'N/A'}</p>
                                        <p><strong>Name:</strong> {selectedLog.target.name || 'N/A'}</p>
                                    </div>
                                </div>
                                {selectedLog.error && (
                                    <div>
                                        <label className="text-sm text-gray-500">Error</label>
                                        <p className="text-red-600 bg-red-50 rounded-lg p-3 mt-1">{selectedLog.error}</p>
                                    </div>
                                )}
                                <div>
                                    <label className="text-sm text-gray-500">Timestamp</label>
                                    <p>{new Date(selectedLog.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AuditLogs;
