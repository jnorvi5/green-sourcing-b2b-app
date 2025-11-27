import { useState, useEffect } from 'react';
import {
    Package,
    Search,
    Filter,
    Plus,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    BarChart3,
    Leaf,
    ArrowUpDown,
    Eye,
    Edit,
    MoreVertical,
    Truck,
    RefreshCw,
    Box,
    DollarSign,
    ShoppingCart,
    Bell,
} from 'lucide-react';

interface InventoryItem {
    _id: string;
    sku: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reservedQuantity: number;
    availableQuantity: number;
    reorderPoint: number;
    safetyStock: number;
    maxStock: number;
    unitCost: number;
    currency: string;
    warehouseName?: string;
    sustainability: {
        recycledContent: number;
        carbonFootprint: number;
        sustainabilityScore: number;
    };
    status: 'active' | 'inactive' | 'discontinued';
    lastOrderDate?: string;
}

interface StockAlert {
    _id: string;
    itemSku: string;
    itemName: string;
    alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring_soon';
    severity: 'low' | 'medium' | 'high' | 'critical';
    currentQuantity: number;
    threshold: number;
    message: string;
    suggestedAction: string;
    suggestedOrderQuantity?: number;
}

interface InventoryStats {
    totalItems: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    sustainabilityScore: number;
}

const severityColors = {
    low: 'bg-blue-100 text-blue-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    critical: 'bg-red-100 text-red-700',
};

const stockStatusColors = {
    healthy: 'text-green-600',
    low: 'text-yellow-600',
    critical: 'text-red-600',
};

export default function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [alerts, setAlerts] = useState<StockAlert[]>([]);
    const [stats, setStats] = useState<InventoryStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [stockFilter, setStockFilter] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'quantity' | 'value'>('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showNewItem, setShowNewItem] = useState(false);
    const [activeTab, setActiveTab] = useState<'inventory' | 'alerts' | 'orders'>('inventory');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsRes, alertsRes] = await Promise.all([
                fetch('/api/inventory?organizationId=org-demo'),
                fetch('/api/inventory/alerts?organizationId=org-demo'),
            ]);

            if (itemsRes.ok) {
                const data = await itemsRes.json();
                setItems(data.items || []);
            }
            if (alertsRes.ok) {
                setAlerts(await alertsRes.json());
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
            // Mock data
            setItems([
                {
                    _id: '1',
                    sku: 'STL-RCY-001',
                    name: 'Recycled Steel Beam (W12x26)',
                    category: 'Structural Steel',
                    quantity: 250,
                    unit: 'pieces',
                    reservedQuantity: 45,
                    availableQuantity: 205,
                    reorderPoint: 50,
                    safetyStock: 25,
                    maxStock: 500,
                    unitCost: 485,
                    currency: 'USD',
                    warehouseName: 'Main Warehouse',
                    sustainability: { recycledContent: 95, carbonFootprint: 0.5, sustainabilityScore: 92 },
                    status: 'active',
                    lastOrderDate: '2024-03-15',
                },
                {
                    _id: '2',
                    sku: 'CON-LC-002',
                    name: 'Low-Carbon Concrete Mix',
                    category: 'Concrete',
                    quantity: 15,
                    unit: 'cubic yards',
                    reservedQuantity: 5,
                    availableQuantity: 10,
                    reorderPoint: 20,
                    safetyStock: 10,
                    maxStock: 100,
                    unitCost: 145,
                    currency: 'USD',
                    warehouseName: 'Main Warehouse',
                    sustainability: { recycledContent: 30, carbonFootprint: 0.08, sustainabilityScore: 78 },
                    status: 'active',
                    lastOrderDate: '2024-03-10',
                },
                {
                    _id: '3',
                    sku: 'TMB-FSC-003',
                    name: 'FSC Certified CLT Panel',
                    category: 'Timber',
                    quantity: 120,
                    unit: 'panels',
                    reservedQuantity: 20,
                    availableQuantity: 100,
                    reorderPoint: 30,
                    safetyStock: 15,
                    maxStock: 200,
                    unitCost: 890,
                    currency: 'USD',
                    warehouseName: 'Timber Storage',
                    sustainability: { recycledContent: 0, carbonFootprint: -0.7, sustainabilityScore: 95 },
                    status: 'active',
                    lastOrderDate: '2024-03-18',
                },
                {
                    _id: '4',
                    sku: 'INS-MW-004',
                    name: 'Mineral Wool Insulation',
                    category: 'Insulation',
                    quantity: 0,
                    unit: 'bundles',
                    reservedQuantity: 0,
                    availableQuantity: 0,
                    reorderPoint: 50,
                    safetyStock: 20,
                    maxStock: 300,
                    unitCost: 65,
                    currency: 'USD',
                    warehouseName: 'Main Warehouse',
                    sustainability: { recycledContent: 70, carbonFootprint: 1.2, sustainabilityScore: 72 },
                    status: 'active',
                    lastOrderDate: '2024-02-28',
                },
            ]);

            setAlerts([
                {
                    _id: '1',
                    itemSku: 'CON-LC-002',
                    itemName: 'Low-Carbon Concrete Mix',
                    alertType: 'low_stock',
                    severity: 'high',
                    currentQuantity: 15,
                    threshold: 20,
                    message: 'Stock level (15) is below reorder point (20)',
                    suggestedAction: 'Create purchase order to replenish stock',
                    suggestedOrderQuantity: 85,
                },
                {
                    _id: '2',
                    itemSku: 'INS-MW-004',
                    itemName: 'Mineral Wool Insulation',
                    alertType: 'out_of_stock',
                    severity: 'critical',
                    currentQuantity: 0,
                    threshold: 0,
                    message: 'Item is out of stock',
                    suggestedAction: 'Urgent: Create emergency purchase order',
                    suggestedOrderQuantity: 300,
                },
            ]);

            setStats({
                totalItems: 4,
                totalValue: 343520,
                lowStockItems: 1,
                outOfStockItems: 1,
                sustainabilityScore: 84.25,
            });
        } finally {
            setLoading(false);
        }
    };

    const getStockStatus = (item: InventoryItem) => {
        if (item.quantity <= 0) return 'critical';
        if (item.quantity <= item.reorderPoint) return 'low';
        return 'healthy';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const filteredItems = items
        .filter((item) => {
            if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !item.sku.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            if (categoryFilter && item.category !== categoryFilter) return false;
            if (stockFilter === 'low' && item.quantity > item.reorderPoint) return false;
            if (stockFilter === 'out' && item.quantity > 0) return false;
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case 'name':
                    comparison = a.name.localeCompare(b.name);
                    break;
                case 'quantity':
                    comparison = a.quantity - b.quantity;
                    break;
                case 'value':
                    comparison = (a.quantity * a.unitCost) - (b.quantity * b.unitCost);
                    break;
            }
            return sortOrder === 'asc' ? comparison : -comparison;
        });

    const categories = [...new Set(items.map((i) => i.category))];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="w-7 h-7 text-green-600" />
                        Inventory Management
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Track stock levels, manage orders, and optimize procurement
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNewItem(true)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Item
                    </button>
                </div>
            </div>

            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Items</p>
                                <p className="text-2xl font-bold text-gray-800">{stats.totalItems}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Box className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total Value</p>
                                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Low Stock</p>
                                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockItems}</p>
                            </div>
                            <div className="p-3 bg-yellow-100 rounded-full">
                                <TrendingDown className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Out of Stock</p>
                                <p className="text-2xl font-bold text-red-600">{stats.outOfStockItems}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Sustainability</p>
                                <p className="text-2xl font-bold text-green-600">{stats.sustainabilityScore.toFixed(0)}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <Leaf className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b">
                {[
                    { id: 'inventory', label: 'Inventory', icon: Package },
                    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alerts.length },
                    { id: 'orders', label: 'Purchase Orders', icon: ShoppingCart },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`px-4 py-2 font-medium border-b-2 -mb-px flex items-center gap-2 ${activeTab === tab.id
                                ? 'border-green-600 text-green-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {tab.badge !== undefined && tab.badge > 0 && (
                            <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'inventory' && (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search items by name or SKU..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={stockFilter}
                                onChange={(e) => setStockFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="">All Stock Levels</option>
                                <option value="low">Low Stock</option>
                                <option value="out">Out of Stock</option>
                            </select>

                            <button
                                onClick={() => {
                                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                }}
                                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                            >
                                <ArrowUpDown className="w-4 h-4" />
                                Sort
                            </button>
                        </div>
                    </div>

                    {/* Inventory Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
                                Loading inventory...
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                <p>No items found</p>
                            </div>
                        ) : (
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Item</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Category</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Stock</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Value</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Sustainability</th>
                                        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Location</th>
                                        <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredItems.map((item) => {
                                        const stockStatus = getStockStatus(item);
                                        const stockPercent = (item.quantity / item.maxStock) * 100;
                                        return (
                                            <tr key={item._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <div>
                                                        <div className="font-medium text-gray-800">{item.name}</div>
                                                        <div className="text-sm text-gray-500">SKU: {item.sku}</div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {item.category}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-medium ${stockStatusColors[stockStatus]}`}>
                                                                {item.quantity} {item.unit}
                                                            </span>
                                                            {stockStatus === 'critical' && (
                                                                <AlertTriangle className="w-4 h-4 text-red-500" />
                                                            )}
                                                            {stockStatus === 'low' && (
                                                                <TrendingDown className="w-4 h-4 text-yellow-500" />
                                                            )}
                                                        </div>
                                                        <div className="w-24 h-1.5 bg-gray-200 rounded-full">
                                                            <div
                                                                className={`h-full rounded-full ${stockStatus === 'critical' ? 'bg-red-500' :
                                                                        stockStatus === 'low' ? 'bg-yellow-500' : 'bg-green-500'
                                                                    }`}
                                                                style={{ width: `${Math.min(stockPercent, 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {item.reservedQuantity} reserved
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="font-medium">{formatCurrency(item.quantity * item.unitCost)}</div>
                                                    <div className="text-sm text-gray-500">{formatCurrency(item.unitCost)}/unit</div>
                                                </td>
                                                <td className="px-4 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Leaf className={`w-4 h-4 ${item.sustainability.sustainabilityScore >= 80 ? 'text-green-600' :
                                                                item.sustainability.sustainabilityScore >= 60 ? 'text-yellow-600' : 'text-gray-400'
                                                            }`} />
                                                        <div>
                                                            <div className="font-medium">{item.sustainability.sustainabilityScore}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {item.sustainability.recycledContent}% recycled
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-gray-600">
                                                    {item.warehouseName || '-'}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => setSelectedItem(item)}
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}

            {activeTab === 'alerts' && (
                <div className="space-y-4">
                    {alerts.length === 0 ? (
                        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>No active alerts</p>
                        </div>
                    ) : (
                        alerts.map((alert) => (
                            <div
                                key={alert._id}
                                className={`bg-white rounded-lg shadow p-4 border-l-4 ${alert.severity === 'critical' ? 'border-red-500' :
                                        alert.severity === 'high' ? 'border-orange-500' :
                                            alert.severity === 'medium' ? 'border-yellow-500' : 'border-blue-500'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className={`w-5 h-5 mt-0.5 ${alert.severity === 'critical' ? 'text-red-500' :
                                                alert.severity === 'high' ? 'text-orange-500' :
                                                    alert.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                                            }`} />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium">{alert.itemName}</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[alert.severity]}`}>
                                                    {alert.severity.toUpperCase()}
                                                </span>
                                            </div>
                                            <p className="text-gray-600">{alert.message}</p>
                                            <p className="text-sm text-gray-500 mt-1">{alert.suggestedAction}</p>
                                            {alert.suggestedOrderQuantity && (
                                                <p className="text-sm text-green-600 mt-1">
                                                    Suggested order: {alert.suggestedOrderQuantity} units
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                                            Create PO
                                        </button>
                                        <button className="px-3 py-1 border border-gray-300 text-sm rounded hover:bg-gray-50">
                                            Dismiss
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {activeTab === 'orders' && (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="mb-4">Purchase order management coming soon</p>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Create Purchase Order
                    </button>
                </div>
            )}

            {/* Item Detail Modal */}
            {selectedItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b sticky top-0 bg-white">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-xl font-bold">{selectedItem.name}</h2>
                                    <p className="text-gray-500">SKU: {selectedItem.sku}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500">Current Stock</div>
                                    <div className="text-2xl font-bold">{selectedItem.quantity} {selectedItem.unit}</div>
                                    <div className="text-sm text-gray-500">
                                        Available: {selectedItem.availableQuantity} | Reserved: {selectedItem.reservedQuantity}
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <div className="text-sm text-gray-500">Total Value</div>
                                    <div className="text-2xl font-bold">{formatCurrency(selectedItem.quantity * selectedItem.unitCost)}</div>
                                    <div className="text-sm text-gray-500">Unit cost: {formatCurrency(selectedItem.unitCost)}</div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Stock Levels</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Reorder Point</span>
                                        <span>{selectedItem.reorderPoint} {selectedItem.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Safety Stock</span>
                                        <span>{selectedItem.safetyStock} {selectedItem.unit}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Max Stock</span>
                                        <span>{selectedItem.maxStock} {selectedItem.unit}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <Leaf className="w-4 h-4 text-green-600" />
                                    Sustainability
                                </h3>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedItem.sustainability.sustainabilityScore}</div>
                                        <div className="text-xs text-gray-500">Score</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedItem.sustainability.recycledContent}%</div>
                                        <div className="text-xs text-gray-500">Recycled</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{selectedItem.sustainability.carbonFootprint}</div>
                                        <div className="text-xs text-gray-500">kg CO₂e/unit</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    Create Purchase Order
                                </button>
                                <button
                                    onClick={() => setSelectedItem(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* New Item Modal */}
            {showNewItem && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full">
                        <div className="p-6 border-b">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold">Add Inventory Item</h2>
                                <button
                                    onClick={() => setShowNewItem(false)}
                                    className="text-gray-400 hover:text-gray-600 text-2xl"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                                        <option value="">Select category...</option>
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                                <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2" placeholder="e.g., pieces" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost</label>
                                    <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowNewItem(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                    Add Item
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
