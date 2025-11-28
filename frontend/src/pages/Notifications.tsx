import React, { useState, useEffect } from 'react';
import {
    Bell,
    BellOff,
    Check,
    CheckCheck,
    Trash2,
    Settings,
    Filter,
    Search,
    RefreshCw,
    Package,
    MessageSquare,
    DollarSign,
    FileText,
    AlertTriangle,
    Info,
    Star,
    Users,
    ShoppingCart,
    Clock,
    ChevronDown,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface Notification {
    _id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    priority: string;
    link?: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

const Notifications: React.FC = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read
    const [typeFilter, setTypeFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        const mockNotifications: Notification[] = [
            {
                _id: '1',
                type: 'order',
                title: 'New Order Received',
                message: 'You have a new order #ORD-2024-001 from Green Construction Co for $15,000',
                read: false,
                priority: 'high',
                link: '/orders/ORD-2024-001',
                metadata: { orderId: 'ORD-2024-001', amount: 15000 },
                createdAt: new Date(Date.now() - 300000).toISOString(),
            },
            {
                _id: '2',
                type: 'rfq',
                title: 'RFQ Response Required',
                message: 'A buyer has requested a quote for recycled steel beams. Response deadline: 3 days',
                read: false,
                priority: 'high',
                link: '/rfqs/RFQ-2024-015',
                createdAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
                _id: '3',
                type: 'message',
                title: 'New Message',
                message: 'John Builder sent you a message about your bamboo flooring products',
                read: false,
                priority: 'medium',
                link: '/messages',
                createdAt: new Date(Date.now() - 7200000).toISOString(),
            },
            {
                _id: '4',
                type: 'payment',
                title: 'Payment Received',
                message: 'Payment of $8,500 received for order #ORD-2024-003',
                read: true,
                priority: 'medium',
                link: '/payments',
                metadata: { orderId: 'ORD-2024-003', amount: 8500 },
                createdAt: new Date(Date.now() - 86400000).toISOString(),
            },
            {
                _id: '5',
                type: 'review',
                title: 'New Product Review',
                message: 'EcoMaterials Inc left a 5-star review on your recycled insulation product',
                read: true,
                priority: 'low',
                link: '/products/prod-123/reviews',
                createdAt: new Date(Date.now() - 172800000).toISOString(),
            },
            {
                _id: '6',
                type: 'system',
                title: 'Certificate Expiring',
                message: 'Your ISO 14001 certification expires in 30 days. Please renew to maintain supplier status.',
                read: false,
                priority: 'high',
                link: '/documents',
                createdAt: new Date(Date.now() - 259200000).toISOString(),
            },
            {
                _id: '7',
                type: 'order',
                title: 'Order Shipped',
                message: 'Order #ORD-2024-002 has been marked as shipped. Tracking: 1Z999AA10123456784',
                read: true,
                priority: 'medium',
                link: '/orders/ORD-2024-002',
                createdAt: new Date(Date.now() - 345600000).toISOString(),
            },
            {
                _id: '8',
                type: 'promotion',
                title: 'Featured Supplier Opportunity',
                message: 'Your products qualify for featured placement. Upgrade to get 3x more visibility!',
                read: true,
                priority: 'low',
                link: '/settings/subscription',
                createdAt: new Date(Date.now() - 432000000).toISOString(),
            },
        ];

        setNotifications(mockNotifications);
        setLoading(false);
    }, []);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'order':
                return <ShoppingCart className="w-5 h-5 text-blue-600" />;
            case 'rfq':
                return <FileText className="w-5 h-5 text-purple-600" />;
            case 'message':
                return <MessageSquare className="w-5 h-5 text-green-600" />;
            case 'payment':
                return <DollarSign className="w-5 h-5 text-emerald-600" />;
            case 'review':
                return <Star className="w-5 h-5 text-amber-600" />;
            case 'system':
                return <AlertTriangle className="w-5 h-5 text-red-600" />;
            case 'promotion':
                return <Info className="w-5 h-5 text-cyan-600" />;
            default:
                return <Bell className="w-5 h-5 text-gray-600" />;
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'border-l-red-500';
            case 'medium':
                return 'border-l-amber-500';
            case 'low':
                return 'border-l-gray-300';
            default:
                return 'border-l-gray-200';
        }
    };

    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n._id !== id));
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread' && n.read) return false;
        if (filter === 'read' && !n.read) return false;
        if (typeFilter && n.type !== typeFilter) return false;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="flex min-h-screen bg-gray-50">
            <DashboardSidebar />

            <main className="flex-1 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                        <p className="text-gray-500 mt-1">
                            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                        </p>
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
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Mark All Read
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div
                        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setFilter('all')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-blue-50 rounded-lg">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">All Notifications</p>
                        <p className="text-2xl font-bold">{notifications.length}</p>
                    </div>

                    <div
                        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer transition-all ${filter === 'unread' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setFilter('unread')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-red-50 rounded-lg">
                                <Bell className="w-5 h-5 text-red-600" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">Unread</p>
                        <p className="text-2xl font-bold">{unreadCount}</p>
                    </div>

                    <div
                        className={`bg-white rounded-xl shadow-sm border border-gray-100 p-5 cursor-pointer transition-all ${filter === 'read' ? 'ring-2 ring-green-500' : ''}`}
                        onClick={() => setFilter('read')}
                    >
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-green-50 rounded-lg">
                                <Check className="w-5 h-5 text-green-600" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">Read</p>
                        <p className="text-2xl font-bold">{notifications.length - unreadCount}</p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div className="flex items-center justify-between">
                            <div className="p-2.5 bg-purple-50 rounded-lg">
                                <AlertTriangle className="w-5 h-5 text-purple-600" />
                            </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-4">High Priority</p>
                        <p className="text-2xl font-bold">
                            {notifications.filter(n => n.priority === 'high' && !n.read).length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                {showFilters && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-gray-700">Type:</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2"
                            >
                                <option value="">All Types</option>
                                <option value="order">Orders</option>
                                <option value="rfq">RFQs</option>
                                <option value="message">Messages</option>
                                <option value="payment">Payments</option>
                                <option value="review">Reviews</option>
                                <option value="system">System</option>
                                <option value="promotion">Promotions</option>
                            </select>
                            <button
                                onClick={() => {
                                    setFilter('all');
                                    setTypeFilter('');
                                }}
                                className="text-sm text-gray-500 hover:text-gray-700"
                            >
                                Clear All
                            </button>
                        </div>
                    </div>
                )}

                {/* Notifications List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <BellOff className="w-12 h-12 text-gray-300 mb-4" />
                            <p className="text-gray-500 text-lg">No notifications</p>
                            <p className="text-gray-400 text-sm mt-1">
                                {filter !== 'all' ? 'Try changing your filter' : "You're all caught up!"}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification._id}
                                    className={`p-5 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${!notification.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className={`p-2.5 rounded-lg ${!notification.read ? 'bg-white shadow-sm' : 'bg-gray-100'}`}>
                                            {getTypeIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 ml-4">
                                                    {!notification.read && (
                                                        <button
                                                            onClick={() => markAsRead(notification._id)}
                                                            className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-green-600"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification._id)}
                                                        className="p-1.5 hover:bg-white rounded text-gray-400 hover:text-red-600"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {getRelativeTime(notification.createdAt)}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 capitalize">
                                                    {notification.type}
                                                </span>
                                                {notification.priority === 'high' && (
                                                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                                                        High Priority
                                                    </span>
                                                )}
                                                {!notification.read && (
                                                    <span className="w-2 h-2 rounded-full bg-blue-500" title="Unread" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Notifications;
