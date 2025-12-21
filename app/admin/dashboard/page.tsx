'use client';

'use client';

import { useState, useEffect } from 'react';

interface DashboardStats {
  totalUsers: number;
  totalSuppliers: number;
  totalBuyers: number;
  totalRFQs: number;
  pendingApprovals: number;
  recentActivity: Record<string, unknown>[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats({
          totalUsers: data.totalUsers,
          totalSuppliers: data.totalSuppliers,
          totalBuyers: data.totalBuyers,
          totalRFQs: data.totalRFQs,
          pendingApprovals: data.pendingRFQs,
          recentActivity: data.recentActivity
        });
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAutomation = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/automation/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        alert(`${type} automation completed successfully`);
        loadDashboardData();
      }
    } catch (error) {
      alert(`Error running ${type} automation`);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats?.totalUsers || 0} />
          <StatCard title="Suppliers" value={stats?.totalSuppliers || 0} />
          <StatCard title="Buyers" value={stats?.totalBuyers || 0} />
          <StatCard title="RFQs" value={stats?.totalRFQs || 0} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {['overview', 'automation', 'users', 'suppliers', 'rfqs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize ${
                    activeTab === tab
                      ? 'border-b-2 border-green-500 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'automation' && <AutomationTab onRun={runAutomation} />}
            {activeTab === 'users' && <UsersTab />}
            {activeTab === 'suppliers' && <SuppliersTab />}
            {activeTab === 'rfqs' && <RFQsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

function OverviewTab() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">System Overview</h2>
      <p className="text-gray-600">Platform health and recent activity</p>
    </div>
  );
}

function AutomationTab({ onRun }: { onRun: (type: string) => void }) {
  const automations = [
    { id: 'sync-epds', name: 'Sync EPD Data', description: 'Pull latest EPDs from providers' },
    { id: 'match-suppliers', name: 'Run Supplier Matching', description: 'Match pending RFQs with suppliers' },
    { id: 'send-notifications', name: 'Send Notifications', description: 'Process pending notifications' },
    { id: 'update-certifications', name: 'Update Certifications', description: 'Verify and update certifications' },
    { id: 'generate-reports', name: 'Generate Reports', description: 'Create weekly analytics reports' }
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Automation Tools</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {automations.map((auto) => (
          <div key={auto.id} className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">{auto.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{auto.description}</p>
            <button
              onClick={() => onRun(auto.id)}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Run Now
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UsersTab() {
  return <div>User management coming soon</div>;
}

function SuppliersTab() {
  return <div>Supplier management coming soon</div>;
}

function RFQsTab() {
  return <div>RFQ management coming soon</div>;
}
