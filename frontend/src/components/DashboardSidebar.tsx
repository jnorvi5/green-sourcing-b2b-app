/**
 * DashboardSidebar Component
 *
 * Unified navigation sidebar for all dashboard types (buyer, supplier, admin)
 */
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Logo from './Logo';
import {
    Home,
    Search,
    ShoppingCart,
    Package,
    FileText,
    MessageSquare,
    Settings,
    HelpCircle,
    ChevronLeft,
    ChevronRight,
    BarChart2,
    Heart,
    Users,
    Inbox,
    ClipboardList,
    Building,
    Shield,
    Plug,
    TrendingUp,
    FolderOpen,
    Star,
    CreditCard,
    Bell,
    LogOut,
    Truck,
    Factory,
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: React.ReactNode;
    path: string;
    badge?: number;
    children?: NavItem[];
}

interface DashboardSidebarProps {
    userType: 'buyer' | 'supplier' | 'admin';
    userName?: string;
    userEmail?: string;
    companyName?: string;
    avatarUrl?: string;
}

const buyerNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/dashboard/buyer' },
    { label: 'Search Products', icon: <Search className="w-5 h-5" />, path: '/search' },
    {
        label: 'Projects',
        icon: <FolderOpen className="w-5 h-5" />,
        path: '/dashboard/buyer/projects',
    },
    {
        label: 'Saved Materials',
        icon: <Heart className="w-5 h-5" />,
        path: '/dashboard/buyer/saved',
    },
    {
        label: 'Favorites',
        icon: <Star className="w-5 h-5" />,
        path: '/dashboard/buyer/favorites',
    },
    {
        label: 'Orders',
        icon: <ShoppingCart className="w-5 h-5" />,
        path: '/dashboard/buyer/orders',
        badge: 3,
    },
    { label: 'Quotes', icon: <FileText className="w-5 h-5" />, path: '/quotes', badge: 2 },
    { label: 'Invoices', icon: <CreditCard className="w-5 h-5" />, path: '/invoices' },
    { label: 'RFQ History', icon: <ClipboardList className="w-5 h-5" />, path: '/rfq-history' },
    {
        label: 'Carbon Analytics',
        icon: <Leaf className="w-5 h-5" />,
        path: '/dashboard/buyer/analytics',
    },
    { label: 'Reports', icon: <BarChart2 className="w-5 h-5" />, path: '/dashboard/buyer/reports' },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages', badge: 5 },
];

const supplierNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/dashboard/supplier' },
    {
        label: 'Products',
        icon: <Package className="w-5 h-5" />,
        path: '/dashboard/supplier/products',
    },
    {
        label: 'RFQs',
        icon: <Inbox className="w-5 h-5" />,
        path: '/dashboard/supplier/rfqs',
        badge: 4,
    },
    { label: 'Orders', icon: <Truck className="w-5 h-5" />, path: '/dashboard/supplier/orders' },
    { label: 'Invoices', icon: <CreditCard className="w-5 h-5" />, path: '/invoices' },
    {
        label: 'Analytics',
        icon: <TrendingUp className="w-5 h-5" />,
        path: '/dashboard/supplier/analytics',
    },
    { label: 'Messages', icon: <MessageSquare className="w-5 h-5" />, path: '/messages', badge: 3 },
    { label: 'Team', icon: <Users className="w-5 h-5" />, path: '/team' },
];

const adminNavItems: NavItem[] = [
    { label: 'Dashboard', icon: <Home className="w-5 h-5" />, path: '/admin' },
    { label: 'Analytics', icon: <BarChart2 className="w-5 h-5" />, path: '/admin/analytics' },
    { label: 'Outreach', icon: <MessageSquare className="w-5 h-5" />, path: '/outreach' },
    { label: 'Users', icon: <Users className="w-5 h-5" />, path: '/admin/users' },
    { label: 'Suppliers', icon: <Factory className="w-5 h-5" />, path: '/admin/suppliers' },
    { label: 'Products', icon: <Package className="w-5 h-5" />, path: '/admin/products' },
    {
        label: 'Content Moderation',
        icon: <Shield className="w-5 h-5" />,
        path: '/admin/content',
    },
    { label: 'Reports', icon: <FileText className="w-5 h-5" />, path: '/admin/reports' },
];

const commonBottomItems: NavItem[] = [
    { label: 'Team', icon: <Users className="w-5 h-5" />, path: '/team' },
    { label: 'Integrations', icon: <Plug className="w-5 h-5" />, path: '/integrations' },
    { label: 'Settings', icon: <Settings className="w-5 h-5" />, path: '/settings' },
    { label: 'Help Center', icon: <HelpCircle className="w-5 h-5" />, path: '/help' },
];

export default function DashboardSidebar({
    userType,
    userName = 'User',
    userEmail = 'user@example.com',
    companyName = 'Company',
    avatarUrl,
}: DashboardSidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const location = useLocation();

    const navItems =
        userType === 'admin'
            ? adminNavItems
            : userType === 'supplier'
                ? supplierNavItems
                : buyerNavItems;

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40 ${isCollapsed ? 'w-16' : 'w-64'
                }`}
        >
            {/* Logo/Brand */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
                {!isCollapsed ? (
                    <Logo variant="main" showText={true} height={32} />
                ) : (
                    <div className="hidden"></div>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`p-2 rounded-lg hover:bg-gray-100 ${isCollapsed ? 'mx-auto' : ''}`}
                >
                    {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    )}
                </button>
            </div>

            {/* User Info */}
            {!isCollapsed && (
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={userName} className="w-10 h-10 rounded-full" />
                        ) : (
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-medium">{getInitials(userName)}</span>
                            </div>
                        )}
                        <div className="overflow-hidden">
                            <p className="font-medium text-gray-900 truncate">{userName}</p>
                            <p className="text-sm text-gray-500 truncate">{companyName}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-2">
                <div className="space-y-1">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={isActive(item.path) ? 'text-green-600' : 'text-gray-500'}>
                                {item.icon}
                            </span>
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 font-medium">{item.label}</span>
                                    {item.badge && (
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                            {item.badge}
                                        </span>
                                    )}
                                </>
                            )}
                            {isCollapsed && item.badge && (
                                <span className="absolute right-1 top-1 w-2 h-2 bg-green-500 rounded-full" />
                            )}
                        </Link>
                    ))}
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-gray-200" />

                {/* Bottom Items */}
                <div className="space-y-1">
                    {(userType !== 'supplier'
                        ? commonBottomItems
                        : commonBottomItems.filter((i) => i.path !== '/team')
                    ).map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.path)
                                ? 'bg-green-50 text-green-700'
                                : 'text-gray-600 hover:bg-gray-100'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={isActive(item.path) ? 'text-green-600' : 'text-gray-500'}>
                                {item.icon}
                            </span>
                            {!isCollapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    ))}
                </div>
            </nav>

            {/* Notifications & Logout */}
            <div className="p-2 border-t border-gray-200">
                <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100 ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={isCollapsed ? 'Notifications' : undefined}
                >
                    <Bell className="w-5 h-5 text-gray-500" />
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 font-medium text-left">Notifications</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                8
                            </span>
                        </>
                    )}
                </button>

                <button
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 ${isCollapsed ? 'justify-center' : ''
                        }`}
                    title={isCollapsed ? 'Logout' : undefined}
                >
                    <LogOut className="w-5 h-5" />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </aside>
    );
}
