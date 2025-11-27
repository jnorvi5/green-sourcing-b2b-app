import { useState, useEffect } from 'react';
import {
  BarChart3,
  Leaf,
  Target,
  TrendingDown,
  TrendingUp,
  FileText,
  Download,
  Plus,
  Calendar,
  Building2,
  Recycle,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock,
  Filter,
  Eye,
  Send,
} from 'lucide-react';

interface SustainabilityReport {
  _id: string;
  reportId: string;
  type: 'monthly' | 'quarterly' | 'annual' | 'custom';
  period: {
    start: string;
    end: string;
  };
  status: 'draft' | 'pending_review' | 'approved' | 'published';
  carbonMetrics: {
    totalEmissions: number;
    scope1: number;
    scope2: number;
    scope3: number;
    netEmissions: number;
    yearOverYearChange: number;
  };
  materialMetrics: {
    recycledContent: number;
    localSourcing: number;
    certifiedMaterials: number;
  };
  supplierMetrics: {
    totalActiveSuppliers: number;
    certifiedSuppliers: number;
    avgSustainabilityScore: number;
  };
  goals: {
    id: string;
    name: string;
    target: number;
    current: number;
    unit: string;
    status: 'on_track' | 'at_risk' | 'behind' | 'achieved';
  }[];
  createdAt: string;
}

interface Goal {
  _id: string;
  name: string;
  category: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  targetDate: string;
  status: 'active' | 'achieved' | 'missed';
}

const statusConfig = {
  draft: { color: 'bg-gray-100 text-gray-700', icon: FileText, label: 'Draft' },
  pending_review: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending Review' },
  approved: { color: 'bg-blue-100 text-blue-700', icon: CheckCircle2, label: 'Approved' },
  published: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Published' },
};

const goalStatusConfig = {
  on_track: { color: 'text-green-600', bg: 'bg-green-100', label: 'On Track' },
  at_risk: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'At Risk' },
  behind: { color: 'text-red-600', bg: 'bg-red-100', label: 'Behind' },
  achieved: { color: 'text-emerald-600', bg: 'bg-emerald-100', label: 'Achieved' },
};

export default function SustainabilityReports() {
  const [reports, setReports] = useState<SustainabilityReport[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'goals' | 'dashboard'>('dashboard');
  const [selectedReport, setSelectedReport] = useState<SustainabilityReport | null>(null);
  const [showNewReport, setShowNewReport] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportsRes, goalsRes] = await Promise.all([
        fetch('/api/sustainability/reports?organizationId=org-demo'),
        fetch('/api/sustainability/goals?organizationId=org-demo'),
      ]);

      if (reportsRes.ok) {
        setReports(await reportsRes.json());
      }
      if (goalsRes.ok) {
        setGoals(await goalsRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Mock data
      setReports([
        {
          _id: '1',
          reportId: 'SR-2024-Q1-abc123',
          type: 'quarterly',
          period: { start: '2024-01-01', end: '2024-03-31' },
          status: 'published',
          carbonMetrics: {
            totalEmissions: 125000,
            scope1: 15000,
            scope2: 35000,
            scope3: 75000,
            netEmissions: 110000,
            yearOverYearChange: -12.5,
          },
          materialMetrics: {
            recycledContent: 65,
            localSourcing: 42,
            certifiedMaterials: 78,
          },
          supplierMetrics: {
            totalActiveSuppliers: 48,
            certifiedSuppliers: 35,
            avgSustainabilityScore: 72,
          },
          goals: [
            { id: '1', name: 'Carbon Reduction', target: 100000, current: 110000, unit: 'kg CO2e', status: 'at_risk' },
            { id: '2', name: 'Recycled Content', target: 80, current: 65, unit: '%', status: 'behind' },
          ],
          createdAt: '2024-04-01',
        },
        {
          _id: '2',
          reportId: 'SR-2024-Q2-def456',
          type: 'quarterly',
          period: { start: '2024-04-01', end: '2024-06-30' },
          status: 'draft',
          carbonMetrics: {
            totalEmissions: 118000,
            scope1: 14000,
            scope2: 32000,
            scope3: 72000,
            netEmissions: 105000,
            yearOverYearChange: -15.2,
          },
          materialMetrics: {
            recycledContent: 68,
            localSourcing: 45,
            certifiedMaterials: 80,
          },
          supplierMetrics: {
            totalActiveSuppliers: 52,
            certifiedSuppliers: 40,
            avgSustainabilityScore: 75,
          },
          goals: [
            { id: '1', name: 'Carbon Reduction', target: 100000, current: 105000, unit: 'kg CO2e', status: 'on_track' },
            { id: '2', name: 'Recycled Content', target: 80, current: 68, unit: '%', status: 'at_risk' },
          ],
          createdAt: '2024-07-01',
        },
      ]);

      setGoals([
        {
          _id: '1',
          name: '50% Carbon Reduction by 2025',
          category: 'carbon',
          targetValue: 50,
          currentValue: 35,
          unit: '%',
          targetDate: '2025-12-31',
          status: 'active',
        },
        {
          _id: '2',
          name: '90% Recycled Content',
          category: 'sourcing',
          targetValue: 90,
          currentValue: 68,
          unit: '%',
          targetDate: '2025-06-30',
          status: 'active',
        },
        {
          _id: '3',
          name: '100% Certified Suppliers',
          category: 'supplier',
          targetValue: 100,
          currentValue: 77,
          unit: '%',
          targetDate: '2024-12-31',
          status: 'active',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  // Get latest report for dashboard
  const latestReport = reports.find((r) => r.status === 'published') || reports[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Leaf className="w-7 h-7 text-green-600" />
            Sustainability Reports
          </h1>
          <p className="text-gray-500 mt-1">
            Track, measure, and report on your sustainability performance
          </p>
        </div>
        <button
          onClick={() => setShowNewReport(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Report
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b">
        {(['dashboard', 'reports', 'goals'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && latestReport && (
        <div className="space-y-6">
          {/* Carbon Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Total Emissions</span>
                <BarChart3 className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">
                {formatNumber(latestReport.carbonMetrics.totalEmissions)} kg
              </div>
              <div className={`text-sm flex items-center gap-1 ${
                latestReport.carbonMetrics.yearOverYearChange < 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {latestReport.carbonMetrics.yearOverYearChange < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <TrendingUp className="w-4 h-4" />
                )}
                {Math.abs(latestReport.carbonMetrics.yearOverYearChange).toFixed(1)}% YoY
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Recycled Content</span>
                <Recycle className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {latestReport.materialMetrics.recycledContent}%
              </div>
              <div className="text-sm text-gray-500">
                Target: 80%
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Certified Suppliers</span>
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">
                {latestReport.supplierMetrics.certifiedSuppliers}/{latestReport.supplierMetrics.totalActiveSuppliers}
              </div>
              <div className="text-sm text-gray-500">
                {((latestReport.supplierMetrics.certifiedSuppliers / latestReport.supplierMetrics.totalActiveSuppliers) * 100).toFixed(0)}% certified
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Avg. Supplier Score</span>
                <Target className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-2xl font-bold">
                {latestReport.supplierMetrics.avgSustainabilityScore}/100
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${latestReport.supplierMetrics.avgSustainabilityScore}%` }}
                />
              </div>
            </div>
          </div>

          {/* Emissions Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Emissions by Scope</h3>
              <div className="space-y-4">
                {[
                  { label: 'Scope 1 (Direct)', value: latestReport.carbonMetrics.scope1, color: 'bg-red-500' },
                  { label: 'Scope 2 (Energy)', value: latestReport.carbonMetrics.scope2, color: 'bg-yellow-500' },
                  { label: 'Scope 3 (Supply Chain)', value: latestReport.carbonMetrics.scope3, color: 'bg-blue-500' },
                ].map((scope) => (
                  <div key={scope.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">{scope.label}</span>
                      <span className="font-medium">{formatNumber(scope.value)} kg CO₂e</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${scope.color} h-3 rounded-full`}
                        style={{
                          width: `${(scope.value / latestReport.carbonMetrics.totalEmissions) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {((scope.value / latestReport.carbonMetrics.totalEmissions) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Goal Progress</h3>
              <div className="space-y-4">
                {latestReport.goals.map((goal) => {
                  const statusInfo = goalStatusConfig[goal.status];
                  const progress = (goal.current / goal.target) * 100;
                  return (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{goal.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              goal.status === 'achieved' ? 'bg-emerald-500' :
                              goal.status === 'on_track' ? 'bg-green-500' :
                              goal.status === 'at_risk' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-12 text-right">
                          {progress.toFixed(0)}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {goal.current} / {goal.target} {goal.unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b flex items-center gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search reports..."
                className="w-full pl-4 pr-4 py-2 border border-gray-200 rounded-lg"
              />
            </div>
            <button className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No reports found</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Report</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Period</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Emissions</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Change</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {reports.map((report) => {
                  const statusInfo = statusConfig[report.status];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={report._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium">{report.reportId}</div>
                          <div className="text-sm text-gray-500 capitalize">{report.type} Report</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(report.period.start)} - {formatDate(report.period.end)}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {formatNumber(report.carbonMetrics.totalEmissions)} kg
                      </td>
                      <td className="px-4 py-4">
                        <span className={`flex items-center gap-1 ${
                          report.carbonMetrics.yearOverYearChange < 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {report.carbonMetrics.yearOverYearChange < 0 ? (
                            <TrendingDown className="w-4 h-4" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                          {Math.abs(report.carbonMetrics.yearOverYearChange).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setSelectedReport(report)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {report.status === 'approved' && (
                            <button
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-gray-100 rounded"
                              title="Publish"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Active Sustainability Goals</h2>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>

          {goals.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
              <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No goals defined yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {goals.map((goal) => {
                const progress = (goal.currentValue / goal.targetValue) * 100;
                const daysRemaining = Math.ceil(
                  (new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                return (
                  <div key={goal._id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        <span className="text-sm text-gray-500 capitalize">{goal.category}</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        progress >= 100 ? 'bg-green-100 text-green-700' :
                        progress >= 70 ? 'bg-blue-100 text-blue-700' :
                        progress >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {progress.toFixed(0)}%
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-500">Progress</span>
                        <span className="font-medium">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress >= 100 ? 'bg-green-500' :
                            progress >= 70 ? 'bg-blue-500' :
                            progress >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Target Date</span>
                      <span className={`font-medium ${daysRemaining < 30 ? 'text-red-600' : 'text-gray-700'}`}>
                        {formatDate(goal.targetDate)}
                        {daysRemaining > 0 && (
                          <span className="text-gray-400 ml-1">({daysRemaining}d left)</span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold">{selectedReport.reportId}</h2>
                  <p className="text-gray-500">
                    {formatDate(selectedReport.period.start)} - {formatDate(selectedReport.period.end)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-800">
                    {formatNumber(selectedReport.carbonMetrics.totalEmissions)}
                  </div>
                  <div className="text-sm text-gray-500">kg CO₂e Total</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedReport.materialMetrics.recycledContent}%
                  </div>
                  <div className="text-sm text-gray-500">Recycled Content</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedReport.supplierMetrics.avgSustainabilityScore}
                  </div>
                  <div className="text-sm text-gray-500">Avg. Supplier Score</div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Report Modal */}
      {showNewReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Create Sustainability Report</h2>
                <button
                  onClick={() => setShowNewReport(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2">
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annual">Annual</option>
                  <option value="custom">Custom Period</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2" />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewReport(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
