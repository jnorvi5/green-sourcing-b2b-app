// frontend/src/pages/Shipments.tsx
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Truck, 
  MapPin, 
  Calendar, 
  Search, 
  Filter, 
  Plus,
  Eye,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Leaf,
  TrendingUp,
  BarChart3,
  ArrowRight,
  RefreshCw,
  FileText,
  Globe,
  DollarSign
} from 'lucide-react';

interface ShipmentAddress {
  name: string;
  company?: string;
  city: string;
  state: string;
  country: string;
}

interface ShipmentEvent {
  id: string;
  timestamp: string;
  status: string;
  location?: string;
  description: string;
}

interface CarbonFootprint {
  totalEmissions: number;
  unit: string;
  transportMode: string;
  offsetStatus: string;
  offsetCredits?: number;
}

interface Shipment {
  _id: string;
  shipmentId: string;
  status: 'draft' | 'booked' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'returned' | 'cancelled';
  origin: ShipmentAddress;
  destination: ShipmentAddress;
  carrier: {
    name: string;
    trackingNumber: string;
    serviceType: string;
  };
  shippingMethod: string;
  packageCount: number;
  weight: {
    total: number;
    unit: string;
  };
  costs: {
    total: number;
    currency: string;
  };
  carbonFootprint?: CarbonFootprint;
  events: ShipmentEvent[];
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
}

interface ShipmentAnalytics {
  totalShipments: number;
  deliveredOnTime: number;
  averageDeliveryDays: number;
  totalCarbonEmissions: number;
  totalCarbonOffset: number;
  costBreakdown: Record<string, number>;
  carrierPerformance: Array<{
    carrier: string;
    shipments: number;
    onTimeRate: number;
    avgDeliveryDays: number;
  }>;
}

// Mock data
const mockShipments: Shipment[] = [
  {
    _id: '1',
    shipmentId: 'SHP-M1K2N3-ABC123',
    status: 'in_transit',
    origin: { name: 'EcoMaterials Warehouse', company: 'EcoMaterials Inc', city: 'Los Angeles', state: 'CA', country: 'US' },
    destination: { name: 'Green Construction Site', company: 'Green Builders LLC', city: 'San Francisco', state: 'CA', country: 'US' },
    carrier: { name: 'EcoShip', trackingNumber: 'ECO123456789', serviceType: 'Ground - Carbon Neutral' },
    shippingMethod: 'ground',
    packageCount: 5,
    weight: { total: 250, unit: 'kg' },
    costs: { total: 185.50, currency: 'USD' },
    carbonFootprint: { totalEmissions: 12.5, unit: 'kgCO2e', transportMode: 'ground', offsetStatus: 'full', offsetCredits: 12.5 },
    events: [
      { id: '1', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'in_transit', location: 'San Jose, CA', description: 'Package in transit to destination' },
      { id: '2', timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), status: 'picked_up', location: 'Los Angeles, CA', description: 'Package picked up from sender' },
    ],
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    shipmentId: 'SHP-P4Q5R6-DEF456',
    status: 'delivered',
    origin: { name: 'Bamboo Supplies', company: 'Bamboo World', city: 'Portland', state: 'OR', country: 'US' },
    destination: { name: 'Sustainable Designs', company: 'Sustainable Designs Co', city: 'Seattle', state: 'WA', country: 'US' },
    carrier: { name: 'GreenFreight', trackingNumber: 'GF987654321', serviceType: 'Express - Low Carbon' },
    shippingMethod: 'express',
    packageCount: 2,
    weight: { total: 75, unit: 'kg' },
    costs: { total: 125.00, currency: 'USD' },
    carbonFootprint: { totalEmissions: 8.2, unit: 'kgCO2e', transportMode: 'express', offsetStatus: 'partial', offsetCredits: 4.1 },
    events: [
      { id: '1', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), status: 'delivered', location: 'Seattle, WA', description: 'Delivered to recipient' },
    ],
    estimatedDelivery: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    actualDelivery: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    shipmentId: 'SHP-S7T8U9-GHI789',
    status: 'exception',
    origin: { name: 'Cork Factory', company: 'Cork Imports Ltd', city: 'Newark', state: 'NJ', country: 'US' },
    destination: { name: 'Eco Renovations', company: 'Eco Renovations Inc', city: 'Boston', state: 'MA', country: 'US' },
    carrier: { name: 'SustainShip', trackingNumber: 'SS112233445', serviceType: 'Overnight - Zero Emission' },
    shippingMethod: 'overnight',
    packageCount: 1,
    weight: { total: 45, unit: 'kg' },
    costs: { total: 210.00, currency: 'USD' },
    carbonFootprint: { totalEmissions: 0, unit: 'kgCO2e', transportMode: 'overnight', offsetStatus: 'full', offsetCredits: 0 },
    events: [
      { id: '1', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), status: 'exception', location: 'Hartford, CT', description: 'Delivery exception: Address verification needed' },
    ],
    estimatedDelivery: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '4',
    shipmentId: 'SHP-V1W2X3-JKL012',
    status: 'out_for_delivery',
    origin: { name: 'Recycled Steel', company: 'MetalGreen Corp', city: 'Chicago', state: 'IL', country: 'US' },
    destination: { name: 'Green Infrastructure', company: 'Green Infra LLC', city: 'Detroit', state: 'MI', country: 'US' },
    carrier: { name: 'EcoShip', trackingNumber: 'ECO556677889', serviceType: 'Ground - Carbon Neutral' },
    shippingMethod: 'freight',
    packageCount: 10,
    weight: { total: 2500, unit: 'kg' },
    costs: { total: 450.00, currency: 'USD' },
    carbonFootprint: { totalEmissions: 45.8, unit: 'kgCO2e', transportMode: 'freight', offsetStatus: 'none' },
    events: [
      { id: '1', timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), status: 'out_for_delivery', location: 'Detroit, MI', description: 'Out for delivery' },
    ],
    estimatedDelivery: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
  },
];

const mockAnalytics: ShipmentAnalytics = {
  totalShipments: 156,
  deliveredOnTime: 142,
  averageDeliveryDays: 3.2,
  totalCarbonEmissions: 1245.8,
  totalCarbonOffset: 892.4,
  costBreakdown: {
    ground: 12500,
    express: 8200,
    freight: 15600,
    overnight: 4500,
    ocean: 22000,
  },
  carrierPerformance: [
    { carrier: 'EcoShip', shipments: 65, onTimeRate: 94, avgDeliveryDays: 3.1 },
    { carrier: 'GreenFreight', shipments: 48, onTimeRate: 91, avgDeliveryDays: 2.8 },
    { carrier: 'SustainShip', shipments: 28, onTimeRate: 96, avgDeliveryDays: 1.2 },
    { carrier: 'OceanGreen', shipments: 15, onTimeRate: 87, avgDeliveryDays: 18.5 },
  ],
};

const statusConfig: Record<Shipment['status'], { label: string; color: string; icon: React.ReactNode }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: <FileText className="w-4 h-4" /> },
  booked: { label: 'Booked', color: 'bg-blue-100 text-blue-800', icon: <Calendar className="w-4 h-4" /> },
  picked_up: { label: 'Picked Up', color: 'bg-indigo-100 text-indigo-800', icon: <Package className="w-4 h-4" /> },
  in_transit: { label: 'In Transit', color: 'bg-yellow-100 text-yellow-800', icon: <Truck className="w-4 h-4" /> },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-purple-100 text-purple-800', icon: <MapPin className="w-4 h-4" /> },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  exception: { label: 'Exception', color: 'bg-red-100 text-red-800', icon: <AlertTriangle className="w-4 h-4" /> },
  returned: { label: 'Returned', color: 'bg-orange-100 text-orange-800', icon: <RefreshCw className="w-4 h-4" /> },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-600', icon: <XCircle className="w-4 h-4" /> },
};

const Shipments: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>(mockShipments);
  const [analytics, setAnalytics] = useState<ShipmentAnalytics>(mockAnalytics);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'shipments' | 'analytics'>('shipments');

  useEffect(() => {
    // Would fetch data from API
  }, []);

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.shipmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.carrier.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shipment.destination.city.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const getOnTimePercentage = () => {
    return Math.round((analytics.deliveredOnTime / analytics.totalShipments) * 100);
  };

  const getCarbonOffsetPercentage = () => {
    return Math.round((analytics.totalCarbonOffset / analytics.totalCarbonEmissions) * 100);
  };

  const TrackingModal = () => {
    if (!selectedShipment) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shipment Tracking</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedShipment.shipmentId}</p>
              </div>
              <button 
                onClick={() => setShowTrackingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Status Banner */}
            <div className={`p-4 rounded-lg ${statusConfig[selectedShipment.status].color}`}>
              <div className="flex items-center gap-3">
                {statusConfig[selectedShipment.status].icon}
                <div>
                  <p className="font-semibold">{statusConfig[selectedShipment.status].label}</p>
                  {selectedShipment.estimatedDelivery && selectedShipment.status !== 'delivered' && (
                    <p className="text-sm opacity-75">
                      Estimated delivery: {formatDate(selectedShipment.estimatedDelivery)}
                    </p>
                  )}
                  {selectedShipment.actualDelivery && (
                    <p className="text-sm opacity-75">
                      Delivered: {formatDate(selectedShipment.actualDelivery)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Route Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">From</p>
                  <p className="font-semibold text-gray-900">{selectedShipment.origin.city}, {selectedShipment.origin.state}</p>
                  <p className="text-sm text-gray-600">{selectedShipment.origin.company}</p>
                </div>
                <div className="flex-1 px-4">
                  <div className="flex items-center justify-center">
                    <div className="h-0.5 flex-1 bg-green-300"></div>
                    <Truck className="w-6 h-6 text-green-600 mx-2" />
                    <div className="h-0.5 flex-1 bg-green-300"></div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500 uppercase">To</p>
                  <p className="font-semibold text-gray-900">{selectedShipment.destination.city}, {selectedShipment.destination.state}</p>
                  <p className="text-sm text-gray-600">{selectedShipment.destination.company}</p>
                </div>
              </div>
            </div>

            {/* Carrier Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Carrier</p>
                <p className="font-semibold text-gray-900">{selectedShipment.carrier.name}</p>
                <p className="text-sm text-gray-600">{selectedShipment.carrier.serviceType}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1">Tracking Number</p>
                <p className="font-semibold text-gray-900 font-mono">{selectedShipment.carrier.trackingNumber}</p>
              </div>
            </div>

            {/* Carbon Footprint */}
            {selectedShipment.carbonFootprint && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">Carbon Footprint</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-green-600 uppercase">Emissions</p>
                    <p className="font-semibold text-green-800">
                      {selectedShipment.carbonFootprint.totalEmissions} {selectedShipment.carbonFootprint.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase">Offset Status</p>
                    <p className="font-semibold text-green-800 capitalize">
                      {selectedShipment.carbonFootprint.offsetStatus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-green-600 uppercase">Credits Used</p>
                    <p className="font-semibold text-green-800">
                      {selectedShipment.carbonFootprint.offsetCredits || 0} kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tracking Events */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Tracking History</h3>
              <div className="space-y-4">
                {selectedShipment.events
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((event, index) => (
                    <div key={event.id} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {index < selectedShipment.events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{event.description}</p>
                            {event.location && (
                              <p className="text-sm text-gray-500">{event.location}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">{formatDate(event.timestamp)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Package Details */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-gray-500 uppercase">Packages</p>
                <p className="font-semibold text-gray-900">{selectedShipment.packageCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Total Weight</p>
                <p className="font-semibold text-gray-900">
                  {selectedShipment.weight.total} {selectedShipment.weight.unit}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Shipping Cost</p>
                <p className="font-semibold text-gray-900">
                  {formatCurrency(selectedShipment.costs.total, selectedShipment.costs.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AnalyticsDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Shipments</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.totalShipments}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Last 30 days</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">On-Time Delivery</p>
              <p className="text-3xl font-bold text-green-600">{getOnTimePercentage()}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{analytics.deliveredOnTime} of {analytics.totalShipments}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Delivery Time</p>
              <p className="text-3xl font-bold text-gray-900">{analytics.averageDeliveryDays} days</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">↓ 0.3 days from last month</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Carbon Offset</p>
              <p className="text-3xl font-bold text-green-600">{getCarbonOffsetPercentage()}%</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">{analytics.totalCarbonOffset.toFixed(1)} kg CO₂e offset</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-gray-400" />
            Cost by Shipping Method
          </h3>
          <div className="space-y-4">
            {Object.entries(analytics.costBreakdown).map(([method, cost]) => {
              const totalCost = Object.values(analytics.costBreakdown).reduce((a, b) => a + b, 0);
              const percentage = (cost / totalCost) * 100;
              return (
                <div key={method}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{method}</span>
                    <span className="font-medium">{formatCurrency(cost, 'USD')}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carrier Performance */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            Carrier Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="pb-3">Carrier</th>
                  <th className="pb-3">Shipments</th>
                  <th className="pb-3">On-Time</th>
                  <th className="pb-3">Avg Days</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analytics.carrierPerformance.map((carrier) => (
                  <tr key={carrier.carrier}>
                    <td className="py-3 font-medium text-gray-900">{carrier.carrier}</td>
                    <td className="py-3 text-gray-600">{carrier.shipments}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        carrier.onTimeRate >= 95 ? 'bg-green-100 text-green-800' :
                        carrier.onTimeRate >= 90 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {carrier.onTimeRate}%
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">{carrier.avgDeliveryDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Carbon Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Carbon Impact Summary</h3>
            <p className="opacity-90">Total emissions from shipping operations</p>
          </div>
          <Leaf className="w-12 h-12 opacity-50" />
        </div>
        <div className="grid grid-cols-3 gap-8 mt-6">
          <div>
            <p className="text-3xl font-bold">{analytics.totalCarbonEmissions.toFixed(1)}</p>
            <p className="opacity-75">kg CO₂e Total Emissions</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{analytics.totalCarbonOffset.toFixed(1)}</p>
            <p className="opacity-75">kg CO₂e Offset</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{(analytics.totalCarbonEmissions - analytics.totalCarbonOffset).toFixed(1)}</p>
            <p className="opacity-75">kg CO₂e Net Emissions</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Shipment Tracking</h1>
              <p className="text-gray-500 mt-1">Track and manage your shipments with real-time updates</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              New Shipment
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('shipments')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'shipments'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Truck className="w-4 h-4 inline mr-2" />
              Shipments
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'analytics' ? (
          <AnalyticsDashboard />
        ) : (
          <>
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by shipment ID, tracking number, or destination..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="booked">Booked</option>
                    <option value="picked_up">Picked Up</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                    <option value="exception">Exception</option>
                  </select>
                  <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    More Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Active Shipments Alert */}
            {shipments.filter(s => s.status === 'exception').length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">
                      {shipments.filter(s => s.status === 'exception').length} shipment(s) require attention
                    </p>
                    <p className="text-sm text-red-600">Review exceptions to ensure timely delivery</p>
                  </div>
                </div>
              </div>
            )}

            {/* Shipments Grid */}
            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment._id}
                  className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Shipment Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[shipment.status].color}`}>
                          {statusConfig[shipment.status].icon}
                          {statusConfig[shipment.status].label}
                        </span>
                        <span className="text-sm font-mono text-gray-500">{shipment.shipmentId}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <span>{shipment.origin.city}, {shipment.origin.state}</span>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {shipment.destination.city}, {shipment.destination.state}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Truck className="w-4 h-4" />
                          {shipment.carrier.name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Package className="w-4 h-4" />
                          {shipment.packageCount} pkg • {shipment.weight.total} {shipment.weight.unit}
                        </span>
                        {shipment.estimatedDelivery && shipment.status !== 'delivered' && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Est. {new Date(shipment.estimatedDelivery).toLocaleDateString()}
                          </span>
                        )}
                        {shipment.carbonFootprint && (
                          <span className="flex items-center gap-1 text-green-600">
                            <Leaf className="w-4 h-4" />
                            {shipment.carbonFootprint.totalEmissions} kg CO₂e
                            {shipment.carbonFootprint.offsetStatus === 'full' && (
                              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Offset</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-gray-900">
                        {formatCurrency(shipment.costs.total, shipment.costs.currency)}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedShipment(shipment);
                          setShowTrackingModal(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Track
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar for active shipments */}
                  {['picked_up', 'in_transit', 'out_for_delivery'].includes(shipment.status) && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Picked Up</span>
                        <span>In Transit</span>
                        <span>Out for Delivery</span>
                        <span>Delivered</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: shipment.status === 'picked_up' ? '25%' :
                                   shipment.status === 'in_transit' ? '50%' :
                                   shipment.status === 'out_for_delivery' ? '75%' : '100%'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {filteredShipments.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No shipments found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && <TrackingModal />}
    </div>
  );
};

export default Shipments;
