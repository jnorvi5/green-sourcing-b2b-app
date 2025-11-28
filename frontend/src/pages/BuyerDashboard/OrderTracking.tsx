/**
 * Order Tracking Page
 *
 * Displays all orders for the buyer with status tracking,
 * delivery updates, and order details
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    TruckIcon,
    CheckCircleIcon,
    ClockIcon,
    DocumentTextIcon,
    MapPinIcon,
    BuildingOffice2Icon,
    ChevronRightIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon,
    PhoneIcon,
    EnvelopeIcon,
} from '@heroicons/react/24/outline';

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    carbonFootprint: number;
}

interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    supplier: {
        name: string;
        id: string;
        phone?: string;
        email?: string;
    };
    items: OrderItem[];
    totalAmount: number;
    totalCarbon: number;
    project: string;
    deliveryAddress: string;
    estimatedDelivery: string;
    actualDelivery?: string;
    trackingNumber?: string;
    carrier?: string;
    createdAt: string;
    statusHistory: {
        status: OrderStatus;
        timestamp: string;
        note?: string;
    }[];
}

const MOCK_ORDERS: Order[] = [
    {
        id: '1',
        orderNumber: 'ORD-2024-0892',
        status: 'in_transit',
        supplier: {
            name: 'EcoSteel Solutions',
            id: 's1',
            phone: '+1 (555) 123-4567',
            email: 'orders@ecosteel.com',
        },
        items: [
            { id: 'i1', productName: 'Recycled Structural Steel Beams', quantity: 50, unit: 'tons', unitPrice: 1850, carbonFootprint: 850 },
            { id: 'i2', productName: 'Steel Reinforcement Bars', quantity: 20, unit: 'tons', unitPrice: 1200, carbonFootprint: 720 },
        ],
        totalAmount: 116500,
        totalCarbon: 59500,
        project: 'Downtown Mixed-Use Development',
        deliveryAddress: '1234 Construction Ave, Portland, OR 97201',
        estimatedDelivery: '2024-02-15',
        trackingNumber: 'TRK-789456123',
        carrier: 'FreightMax Logistics',
        createdAt: '2024-01-20',
        statusHistory: [
            { status: 'pending', timestamp: '2024-01-20T10:00:00Z' },
            { status: 'confirmed', timestamp: '2024-01-20T14:30:00Z', note: 'Order confirmed by supplier' },
            { status: 'processing', timestamp: '2024-01-22T09:00:00Z', note: 'Materials being prepared' },
            { status: 'shipped', timestamp: '2024-01-28T11:00:00Z', note: 'Shipped via FreightMax' },
            { status: 'in_transit', timestamp: '2024-01-29T08:00:00Z', note: 'En route to destination' },
        ],
    },
    {
        id: '2',
        orderNumber: 'ORD-2024-0856',
        status: 'delivered',
        supplier: {
            name: 'GreenConcrete Inc',
            id: 's2',
            email: 'support@greenconcrete.com',
        },
        items: [
            { id: 'i3', productName: 'Low-Carbon Concrete Mix Type A', quantity: 500, unit: 'cubic yards', unitPrice: 185, carbonFootprint: 180 },
        ],
        totalAmount: 92500,
        totalCarbon: 90000,
        project: 'LEED Platinum Office Tower',
        deliveryAddress: '5678 Build Street, Seattle, WA 98101',
        estimatedDelivery: '2024-01-25',
        actualDelivery: '2024-01-24',
        createdAt: '2024-01-10',
        statusHistory: [
            { status: 'pending', timestamp: '2024-01-10T09:00:00Z' },
            { status: 'confirmed', timestamp: '2024-01-10T11:00:00Z' },
            { status: 'processing', timestamp: '2024-01-12T08:00:00Z' },
            { status: 'shipped', timestamp: '2024-01-22T10:00:00Z' },
            { status: 'delivered', timestamp: '2024-01-24T14:00:00Z', note: 'Delivered - signed by J. Smith' },
        ],
    },
    {
        id: '3',
        orderNumber: 'ORD-2024-0901',
        status: 'processing',
        supplier: {
            name: 'TimberTech FSC',
            id: 's3',
            phone: '+1 (555) 987-6543',
        },
        items: [
            { id: 'i4', productName: 'FSC Certified CLT Panels', quantity: 75, unit: 'panels', unitPrice: 2450, carbonFootprint: -120 },
        ],
        totalAmount: 183750,
        totalCarbon: -9000,
        project: 'Sustainable Housing Complex',
        deliveryAddress: '910 Green Way, San Francisco, CA 94102',
        estimatedDelivery: '2024-03-01',
        createdAt: '2024-01-25',
        statusHistory: [
            { status: 'pending', timestamp: '2024-01-25T10:00:00Z' },
            { status: 'confirmed', timestamp: '2024-01-25T16:00:00Z' },
            { status: 'processing', timestamp: '2024-01-27T09:00:00Z', note: 'Custom dimensions being fabricated' },
        ],
    },
    {
        id: '4',
        orderNumber: 'ORD-2024-0845',
        status: 'cancelled',
        supplier: {
            name: 'InsulPro Materials',
            id: 's4',
        },
        items: [
            { id: 'i5', productName: 'Mineral Wool Insulation R-30', quantity: 5000, unit: 'sq ft', unitPrice: 4.50, carbonFootprint: 2.1 },
        ],
        totalAmount: 22500,
        totalCarbon: 10500,
        project: 'Passive House Renovation',
        deliveryAddress: '456 Energy Lane, Denver, CO 80202',
        estimatedDelivery: '2024-02-10',
        createdAt: '2024-01-08',
        statusHistory: [
            { status: 'pending', timestamp: '2024-01-08T14:00:00Z' },
            { status: 'confirmed', timestamp: '2024-01-09T10:00:00Z' },
            { status: 'cancelled', timestamp: '2024-01-15T11:00:00Z', note: 'Cancelled by buyer - project postponed' },
        ],
    },
];

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof CheckCircleIcon }> = {
    pending: { label: 'Pending', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30', icon: ClockIcon },
    confirmed: { label: 'Confirmed', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: CheckCircleIcon },
    processing: { label: 'Processing', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: ArrowPathIcon },
    shipped: { label: 'Shipped', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: TruckIcon },
    in_transit: { label: 'In Transit', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30', icon: TruckIcon },
    delivered: { label: 'Delivered', color: 'bg-green-500/20 text-green-400 border-green-500/30', icon: CheckCircleIcon },
    cancelled: { label: 'Cancelled', color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: ExclamationTriangleIcon },
};

export default function OrderTracking() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 500));
            setOrders(MOCK_ORDERS);
            setLoading(false);
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter((order) => {
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.project.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
        });
    };

    const getProgressPercentage = (status: OrderStatus): number => {
        const stages: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered'];
        if (status === 'cancelled') return 0;
        const index = stages.indexOf(status);
        return ((index + 1) / stages.length) * 100;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <TruckIcon className="w-8 h-8 text-emerald-500" />
                            Order Tracking
                        </h1>
                        <p className="text-gray-400 mt-1">Track your material orders and deliveries</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                        <div className="text-2xl font-bold">{orders.length}</div>
                        <div className="text-sm text-gray-400">Total Orders</div>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-yellow-400">
                            {orders.filter((o) => ['pending', 'confirmed', 'processing'].includes(o.status)).length}
                        </div>
                        <div className="text-sm text-yellow-300/80">In Progress</div>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-indigo-400">
                            {orders.filter((o) => ['shipped', 'in_transit'].includes(o.status)).length}
                        </div>
                        <div className="text-sm text-indigo-300/80">In Transit</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <div className="text-2xl font-bold text-green-400">{orders.filter((o) => o.status === 'delivered').length}</div>
                        <div className="text-sm text-green-300/80">Delivered</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1 relative">
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by order number, supplier, or project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                    </div>
                    <div className="relative">
                        <FunnelIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-gray-800 border border-gray-700 rounded-lg appearance-none cursor-pointer focus:ring-2 focus:ring-emerald-500"
                        >
                            <option value="all">All Status</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-4">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                            <TruckIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                            <h3 className="text-lg font-medium text-gray-300">No Orders Found</h3>
                            <p className="text-gray-500 mt-1">No orders match your search criteria</p>
                        </div>
                    ) : (
                        filteredOrders.map((order) => {
                            const statusConfig = STATUS_CONFIG[order.status];
                            const StatusIcon = statusConfig.icon;

                            return (
                                <div
                                    key={order.id}
                                    className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-gray-600 transition-colors cursor-pointer"
                                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                >
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Order Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-semibold text-lg">{order.orderNumber}</span>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                                                        <StatusIcon className="w-3 h-3 inline mr-1" />
                                                        {statusConfig.label}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                                                    <BuildingOffice2Icon className="w-4 h-4" />
                                                    <Link
                                                        to={`/supplier/${order.supplier.id}`}
                                                        className="hover:text-emerald-400 transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {order.supplier.name}
                                                    </Link>
                                                    <span className="text-gray-600">•</span>
                                                    <span>{order.project}</span>
                                                </div>

                                                <div className="text-sm text-gray-300">
                                                    {order.items.length} item{order.items.length > 1 ? 's' : ''} •{' '}
                                                    <span className="text-emerald-400 font-medium">${order.totalAmount.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            {/* Delivery Info */}
                                            <div className="lg:text-right">
                                                <div className="text-sm text-gray-400 mb-1">
                                                    {order.status === 'delivered' ? 'Delivered' : 'Est. Delivery'}
                                                </div>
                                                <div className="font-medium">
                                                    {formatDate(order.actualDelivery || order.estimatedDelivery)}
                                                </div>
                                                {order.trackingNumber && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Tracking: {order.trackingNumber}
                                                    </div>
                                                )}
                                            </div>

                                            <ChevronRightIcon
                                                className={`w-5 h-5 text-gray-500 transition-transform ${selectedOrder?.id === order.id ? 'rotate-90' : ''
                                                    }`}
                                            />
                                        </div>

                                        {/* Progress Bar */}
                                        {order.status !== 'cancelled' && (
                                            <div className="mt-4 pt-4 border-t border-gray-700">
                                                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-500"
                                                        style={{ width: `${getProgressPercentage(order.status)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                    <span>Ordered</span>
                                                    <span>Confirmed</span>
                                                    <span>Processing</span>
                                                    <span>Shipped</span>
                                                    <span>Delivered</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {selectedOrder?.id === order.id && (
                                        <div className="border-t border-gray-700 p-6 bg-gray-900/50">
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                {/* Order Items */}
                                                <div>
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                                                        Order Items
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {order.items.map((item) => (
                                                            <div key={item.id} className="bg-gray-800 rounded-lg p-3">
                                                                <div className="font-medium">{item.productName}</div>
                                                                <div className="text-sm text-gray-400 mt-1">
                                                                    {item.quantity.toLocaleString()} {item.unit} × ${item.unitPrice.toLocaleString()} ={' '}
                                                                    <span className="text-emerald-400">
                                                                        ${(item.quantity * item.unitPrice).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    Carbon: {item.carbonFootprint > 0 ? '+' : ''}
                                                                    {(item.carbonFootprint * item.quantity).toLocaleString()} kg CO2e
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Delivery Address */}
                                                    <div className="mt-4">
                                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                            <MapPinIcon className="w-5 h-5 text-gray-400" />
                                                            Delivery Address
                                                        </h4>
                                                        <p className="text-gray-300 text-sm">{order.deliveryAddress}</p>
                                                    </div>

                                                    {/* Supplier Contact */}
                                                    <div className="mt-4">
                                                        <h4 className="font-semibold mb-2">Supplier Contact</h4>
                                                        <div className="flex flex-wrap gap-3">
                                                            {order.supplier.phone && (
                                                                <a
                                                                    href={`tel:${order.supplier.phone}`}
                                                                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <PhoneIcon className="w-4 h-4" />
                                                                    {order.supplier.phone}
                                                                </a>
                                                            )}
                                                            {order.supplier.email && (
                                                                <a
                                                                    href={`mailto:${order.supplier.email}`}
                                                                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-emerald-400 transition-colors"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <EnvelopeIcon className="w-4 h-4" />
                                                                    {order.supplier.email}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Timeline */}
                                                <div>
                                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                        <ClockIcon className="w-5 h-5 text-gray-400" />
                                                        Status History
                                                    </h4>
                                                    <div className="space-y-4">
                                                        {order.statusHistory.map((history, index) => {
                                                            const historyConfig = STATUS_CONFIG[history.status];
                                                            const HistoryIcon = historyConfig.icon;
                                                            const isLatest = index === order.statusHistory.length - 1;

                                                            return (
                                                                <div key={index} className="flex gap-3">
                                                                    <div className="relative">
                                                                        <div
                                                                            className={`w-8 h-8 rounded-full flex items-center justify-center ${isLatest ? 'bg-emerald-500' : 'bg-gray-700'
                                                                                }`}
                                                                        >
                                                                            <HistoryIcon className={`w-4 h-4 ${isLatest ? 'text-white' : 'text-gray-400'}`} />
                                                                        </div>
                                                                        {index < order.statusHistory.length - 1 && (
                                                                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gray-700"></div>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 pb-4">
                                                                        <div className={`font-medium ${isLatest ? 'text-emerald-400' : 'text-gray-300'}`}>
                                                                            {historyConfig.label}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">{formatDateTime(history.timestamp)}</div>
                                                                        {history.note && <div className="text-sm text-gray-400 mt-1">{history.note}</div>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-700">
                                                {order.trackingNumber && (
                                                    <button
                                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Track Shipment
                                                    </button>
                                                )}
                                                <button
                                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Download Invoice
                                                </button>
                                                <button
                                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    Contact Supplier
                                                </button>
                                                {order.status === 'delivered' && (
                                                    <button
                                                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        Leave Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
