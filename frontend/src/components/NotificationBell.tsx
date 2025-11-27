/**
 * Notification System
 * 
 * In-app notifications with bell icon dropdown
 * Handles RFQ updates, new materials, system alerts
 */
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    BellIcon,
    CheckCircleIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    DocumentTextIcon,
    SparklesIcon,
    XMarkIcon,
    CheckIcon,
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

export interface Notification {
    id: string;
    type: 'rfq_response' | 'rfq_update' | 'new_material' | 'system' | 'success' | 'warning';
    title: string;
    message: string;
    link?: string;
    read: boolean;
    createdAt: string;
    metadata?: Record<string, unknown>;
}

interface NotificationBellProps {
    userId?: string;
}

// Mock notifications - replace with API
const MOCK_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        type: 'rfq_response',
        title: 'Quote Received',
        message: 'GreenSteel Inc. responded to your RFQ for recycled structural steel',
        link: '/rfq-history',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
    },
    {
        id: 'notif-2',
        type: 'new_material',
        title: 'New Low-Carbon Materials',
        message: '12 new EPD-verified insulation products added this week',
        link: '/search?category=insulation&sort=newest',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
    {
        id: 'notif-3',
        type: 'rfq_update',
        title: 'RFQ Expiring Soon',
        message: 'Your RFQ for CLT panels expires in 2 days',
        link: '/rfq-history',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    },
    {
        id: 'notif-4',
        type: 'success',
        title: 'Project Created',
        message: 'Your project "Eco Residence Phase 2" has been created',
        link: '/dashboard/buyer/projects',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    },
    {
        id: 'notif-5',
        type: 'system',
        title: 'Platform Update',
        message: 'New carbon analytics dashboard is now available',
        link: '/dashboard/buyer/analytics',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    },
];

export function NotificationBell({ userId }: NotificationBellProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch notifications - replace with real API
        const fetchNotifications = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 300));
            setNotifications(MOCK_NOTIFICATIONS);
            setLoading(false);
        };

        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [userId]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
        // TODO: Call API to mark as read
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        // TODO: Call API to mark all as read
    };

    const deleteNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        // TODO: Call API to delete
    };

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'rfq_response':
            case 'rfq_update':
                return <DocumentTextIcon className="w-5 h-5 text-blue-500" />;
            case 'new_material':
                return <SparklesIcon className="w-5 h-5 text-purple-500" />;
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <ExclamationCircleIcon className="w-5 h-5 text-yellow-500" />;
            default:
                return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-muted transition-colors"
                aria-label="Notifications"
            >
                {unreadCount > 0 ? (
                    <BellSolidIcon className="w-6 h-6 text-foreground" />
                ) : (
                    <BellIcon className="w-6 h-6 text-muted-foreground" />
                )}

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/50">
                        <h3 className="font-semibold text-foreground">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                                <CheckIcon className="w-4 h-4" />
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Notification List */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-muted-foreground">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                <BellIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border">
                                {notifications.map(notification => (
                                    <div
                                        key={notification.id}
                                        className={`px-4 py-3 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-primary/5' : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex-shrink-0 mt-1">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        {notification.link ? (
                                                            <Link
                                                                to={notification.link}
                                                                onClick={() => {
                                                                    markAsRead(notification.id);
                                                                    setIsOpen(false);
                                                                }}
                                                                className="font-medium text-foreground hover:text-primary block"
                                                            >
                                                                {notification.title}
                                                            </Link>
                                                        ) : (
                                                            <span className="font-medium text-foreground">
                                                                {notification.title}
                                                            </span>
                                                        )}
                                                        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <span className="text-xs text-muted-foreground mt-1 block">
                                                            {formatTime(notification.createdAt)}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <XMarkIcon className="w-4 h-4 text-muted-foreground" />
                                                    </button>
                                                </div>
                                            </div>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-border bg-muted/50">
                        <Link
                            to="/dashboard/buyer/notifications"
                            onClick={() => setIsOpen(false)}
                            className="text-sm text-primary hover:underline block text-center"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

// Notification context for app-wide access
import { createContext, useContext, ReactNode } from 'react';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}`,
            createdAt: new Date().toISOString(),
            read: false,
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => (n.id === id ? { ...n, read: true } : n))
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearAll,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}

export default NotificationBell;
