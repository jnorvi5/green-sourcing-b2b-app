// frontend/src/pages/SupplierQualification.tsx
import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  Award,
  TrendingUp,
  Users,
  Search,
  Filter,
  Plus,
  Eye,
  ChevronRight,
  Leaf,
  AlertCircle,
  Calendar,
  BarChart3,
  Star,
  Building2
} from 'lucide-react';

interface QualificationScore {
  criteriaId: string;
  criteriaName: string;
  score: number;
  maxScore: number;
  weight: number;
  weightedScore: number;
}

interface Certification {
  name: string;
  issuer: string;
  validFrom: string;
  validUntil: string;
  status: 'valid' | 'expiring_soon' | 'expired';
}

interface RiskAssessment {
  category: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface SupplierQualification {
  _id: string;
  qualificationId: string;
  supplierId: string;
  supplierName: string;
  status: 'pending' | 'in_review' | 'qualified' | 'conditionally_qualified' | 'disqualified' | 'suspended';
  tier: 'preferred' | 'approved' | 'provisional' | 'restricted';
  overallScore: number;
  scores: QualificationScore[];
  certifications: Certification[];
  riskAssessment: RiskAssessment[];
  overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  sustainabilityProfile?: {
    carbonFootprintScore: number;
    renewableEnergyUsage: number;
    overallSustainabilityScore: number;
  };
  requalificationDue?: string;
  qualificationDate?: string;
  createdAt: string;
}

interface DashboardSummary {
  summary: {
    total: number;
    qualified: number;
    conditionallyQualified: number;
    pendingReview: number;
    disqualified: number;
  };
  byTier: Record<string, number>;
  byRiskLevel: Record<string, number>;
  upcomingRequalifications: number;
  expiringCertifications: number;
  averageScore: number;
}

// Mock data
const mockQualifications: SupplierQualification[] = [
  {
    _id: '1',
    qualificationId: 'QUAL-M1K2N3-AB12',
    supplierId: 'sup-001',
    supplierName: 'EcoSteel Corporation',
    status: 'qualified',
    tier: 'preferred',
    overallScore: 92,
    scores: [
      { criteriaId: 'fin-stability', criteriaName: 'Financial Stability', score: 90, maxScore: 100, weight: 15, weightedScore: 13.5 },
      { criteriaId: 'quality-system', criteriaName: 'Quality Management', score: 100, maxScore: 100, weight: 20, weightedScore: 20 },
      { criteriaId: 'env-management', criteriaName: 'Environmental Management', score: 100, maxScore: 100, weight: 15, weightedScore: 15 },
      { criteriaId: 'carbon-footprint', criteriaName: 'Carbon Footprint', score: 85, maxScore: 100, weight: 10, weightedScore: 8.5 },
      { criteriaId: 'ethical-sourcing', criteriaName: 'Ethical Sourcing', score: 88, maxScore: 100, weight: 10, weightedScore: 8.8 },
    ],
    certifications: [
      { name: 'ISO 9001:2015', issuer: 'BSI', validFrom: '2023-01-15', validUntil: '2026-01-15', status: 'valid' },
      { name: 'ISO 14001:2015', issuer: 'BSI', validFrom: '2023-03-20', validUntil: '2026-03-20', status: 'valid' },
      { name: 'LEED Green Building', issuer: 'USGBC', validFrom: '2022-06-01', validUntil: '2024-08-01', status: 'expiring_soon' },
    ],
    riskAssessment: [
      { category: 'Financial', level: 'low', description: 'Strong financial position' },
      { category: 'Operational', level: 'low', description: 'Robust operations' },
    ],
    overallRiskLevel: 'low',
    sustainabilityProfile: {
      carbonFootprintScore: 85,
      renewableEnergyUsage: 72,
      overallSustainabilityScore: 88,
    },
    requalificationDue: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    qualificationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    qualificationId: 'QUAL-P4Q5R6-CD34',
    supplierId: 'sup-002',
    supplierName: 'GreenBamboo Supplies',
    status: 'conditionally_qualified',
    tier: 'provisional',
    overallScore: 68,
    scores: [
      { criteriaId: 'fin-stability', criteriaName: 'Financial Stability', score: 72, maxScore: 100, weight: 15, weightedScore: 10.8 },
      { criteriaId: 'quality-system', criteriaName: 'Quality Management', score: 100, maxScore: 100, weight: 20, weightedScore: 20 },
      { criteriaId: 'env-management', criteriaName: 'Environmental Management', score: 0, maxScore: 100, weight: 15, weightedScore: 0 },
      { criteriaId: 'carbon-footprint', criteriaName: 'Carbon Footprint', score: 65, maxScore: 100, weight: 10, weightedScore: 6.5 },
    ],
    certifications: [
      { name: 'ISO 9001:2015', issuer: 'TUV', validFrom: '2022-05-10', validUntil: '2025-05-10', status: 'valid' },
    ],
    riskAssessment: [
      { category: 'Financial', level: 'medium', description: 'Moderate financial stability' },
      { category: 'Compliance', level: 'medium', description: 'Missing ISO 14001 certification' },
    ],
    overallRiskLevel: 'medium',
    sustainabilityProfile: {
      carbonFootprintScore: 65,
      renewableEnergyUsage: 45,
      overallSustainabilityScore: 62,
    },
    requalificationDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    qualificationId: 'QUAL-S7T8U9-EF56',
    supplierId: 'sup-003',
    supplierName: 'ReNew Materials Inc',
    status: 'in_review',
    tier: 'restricted',
    overallScore: 0,
    scores: [],
    certifications: [
      { name: 'ISO 9001:2015', issuer: 'DNV', validFrom: '2024-01-01', validUntil: '2027-01-01', status: 'valid' },
    ],
    riskAssessment: [],
    overallRiskLevel: 'medium',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '4',
    qualificationId: 'QUAL-V1W2X3-GH78',
    supplierId: 'sup-004',
    supplierName: 'CorkWorld International',
    status: 'qualified',
    tier: 'approved',
    overallScore: 78,
    scores: [
      { criteriaId: 'fin-stability', criteriaName: 'Financial Stability', score: 80, maxScore: 100, weight: 15, weightedScore: 12 },
      { criteriaId: 'quality-system', criteriaName: 'Quality Management', score: 100, maxScore: 100, weight: 20, weightedScore: 20 },
      { criteriaId: 'env-management', criteriaName: 'Environmental Management', score: 100, maxScore: 100, weight: 15, weightedScore: 15 },
      { criteriaId: 'carbon-footprint', criteriaName: 'Carbon Footprint', score: 70, maxScore: 100, weight: 10, weightedScore: 7 },
    ],
    certifications: [
      { name: 'ISO 9001:2015', issuer: 'SGS', validFrom: '2023-08-01', validUntil: '2026-08-01', status: 'valid' },
      { name: 'ISO 14001:2015', issuer: 'SGS', validFrom: '2023-08-01', validUntil: '2026-08-01', status: 'valid' },
      { name: 'FSC Certified', issuer: 'FSC', validFrom: '2023-01-01', validUntil: '2024-12-31', status: 'valid' },
    ],
    riskAssessment: [
      { category: 'Supply Chain', level: 'medium', description: 'Single source for key materials' },
    ],
    overallRiskLevel: 'medium',
    sustainabilityProfile: {
      carbonFootprintScore: 70,
      renewableEnergyUsage: 55,
      overallSustainabilityScore: 75,
    },
    requalificationDue: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    qualificationDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 300 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockDashboard: DashboardSummary = {
  summary: {
    total: 45,
    qualified: 28,
    conditionallyQualified: 8,
    pendingReview: 6,
    disqualified: 3,
  },
  byTier: {
    preferred: 12,
    approved: 16,
    provisional: 8,
    restricted: 9,
  },
  byRiskLevel: {
    low: 22,
    medium: 15,
    high: 6,
    critical: 2,
  },
  upcomingRequalifications: 5,
  expiringCertifications: 8,
  averageScore: 76,
};

const statusConfig: Record<SupplierQualification['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pending', color: 'bg-gray-100 text-gray-800', icon: <Clock className="w-4 h-4" /> },
  in_review: { label: 'In Review', color: 'bg-blue-100 text-blue-800', icon: <Eye className="w-4 h-4" /> },
  qualified: { label: 'Qualified', color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
  conditionally_qualified: { label: 'Conditional', color: 'bg-yellow-100 text-yellow-800', icon: <AlertCircle className="w-4 h-4" /> },
  disqualified: { label: 'Disqualified', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
  suspended: { label: 'Suspended', color: 'bg-orange-100 text-orange-800', icon: <AlertTriangle className="w-4 h-4" /> },
};

const tierConfig: Record<SupplierQualification['tier'], { label: string; color: string }> = {
  preferred: { label: 'Preferred', color: 'bg-purple-100 text-purple-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  provisional: { label: 'Provisional', color: 'bg-yellow-100 text-yellow-800' },
  restricted: { label: 'Restricted', color: 'bg-gray-100 text-gray-600' },
};

const riskConfig: Record<string, { color: string; bgColor: string }> = {
  low: { color: 'text-green-600', bgColor: 'bg-green-100' },
  medium: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  high: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  critical: { color: 'text-red-600', bgColor: 'bg-red-100' },
};

const SupplierQualificationPage: React.FC = () => {
  const [qualifications, setQualifications] = useState<SupplierQualification[]>(mockQualifications);
  const [dashboard, setDashboard] = useState<DashboardSummary>(mockDashboard);
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'alerts'>('overview');
  const [selectedQualification, setSelectedQualification] = useState<SupplierQualification | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // Would fetch data from API
  }, []);

  const filteredQualifications = qualifications.filter(q => {
    const matchesSearch = 
      q.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.qualificationId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysUntil = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (24 * 60 * 60 * 1000));
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 55) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    if (score >= 55) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const DetailModal = () => {
    if (!selectedQualification) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b sticky top-0 bg-white">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedQualification.supplierName}</h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[selectedQualification.status].color}`}>
                    {statusConfig[selectedQualification.status].icon}
                    {statusConfig[selectedQualification.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{selectedQualification.qualificationId}</p>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Score Overview */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className={`text-3xl font-bold ${getScoreColor(selectedQualification.overallScore)}`}>
                  {selectedQualification.overallScore}
                </p>
                <p className="text-sm text-gray-500">Overall Score</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  <span className={`px-2 py-1 rounded ${tierConfig[selectedQualification.tier].color}`}>
                    {tierConfig[selectedQualification.tier].label}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-1">Tier</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className={`text-lg font-semibold capitalize ${riskConfig[selectedQualification.overallRiskLevel].color}`}>
                  {selectedQualification.overallRiskLevel}
                </p>
                <p className="text-sm text-gray-500">Risk Level</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-lg font-semibold text-gray-900">
                  {selectedQualification.certifications.length}
                </p>
                <p className="text-sm text-gray-500">Certifications</p>
              </div>
            </div>

            {/* Criteria Scores */}
            {selectedQualification.scores.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Qualification Criteria</h3>
                <div className="space-y-3">
                  {selectedQualification.scores.map((score) => (
                    <div key={score.criteriaId}>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">{score.criteriaName}</span>
                        <span className={`text-sm font-semibold ${getScoreColor(score.score)}`}>
                          {score.score}/{score.maxScore}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${getScoreBgColor(score.score)}`}
                          style={{ width: `${score.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Certifications</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedQualification.certifications.map((cert, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      cert.status === 'expired' ? 'border-red-200 bg-red-50' :
                      cert.status === 'expiring_soon' ? 'border-yellow-200 bg-yellow-50' :
                      'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{cert.name}</p>
                        <p className="text-sm text-gray-500">Issued by {cert.issuer}</p>
                      </div>
                      <Award className={`w-5 h-5 ${
                        cert.status === 'expired' ? 'text-red-500' :
                        cert.status === 'expiring_soon' ? 'text-yellow-500' :
                        'text-green-500'
                      }`} />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Valid: {formatDate(cert.validFrom)} - {formatDate(cert.validUntil)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Sustainability Profile */}
            {selectedQualification.sustainabilityProfile && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-semibold text-green-800 mb-4 flex items-center gap-2">
                  <Leaf className="w-5 h-5" />
                  Sustainability Profile
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedQualification.sustainabilityProfile.carbonFootprintScore}
                    </p>
                    <p className="text-xs text-green-700">Carbon Score</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedQualification.sustainabilityProfile.renewableEnergyUsage}%
                    </p>
                    <p className="text-xs text-green-700">Renewable Energy</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {selectedQualification.sustainabilityProfile.overallSustainabilityScore}
                    </p>
                    <p className="text-xs text-green-700">Overall Score</p>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Assessment */}
            {selectedQualification.riskAssessment.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Risk Assessment</h3>
                <div className="space-y-2">
                  {selectedQualification.riskAssessment.map((risk, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg ${riskConfig[risk.level].bgColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`w-4 h-4 ${riskConfig[risk.level].color}`} />
                          <span className="font-medium text-gray-900">{risk.category}</span>
                        </div>
                        <span className={`text-sm font-medium capitalize ${riskConfig[risk.level].color}`}>
                          {risk.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Suppliers</p>
              <p className="text-3xl font-bold text-gray-900">{dashboard.summary.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {dashboard.summary.qualified} qualified
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Average Score</p>
              <p className={`text-3xl font-bold ${getScoreColor(dashboard.averageScore)}`}>
                {dashboard.averageScore}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">↑ 3 pts from last quarter</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Review</p>
              <p className="text-3xl font-bold text-yellow-600">{dashboard.summary.pendingReview}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Awaiting evaluation</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Expiring Certs</p>
              <p className="text-3xl font-bold text-orange-600">{dashboard.expiringCertifications}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">Within 60 days</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Qualification Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm text-gray-700">Qualified</span>
              </div>
              <span className="font-semibold">{dashboard.summary.qualified}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <span className="text-sm text-gray-700">Conditionally Qualified</span>
              </div>
              <span className="font-semibold">{dashboard.summary.conditionallyQualified}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-700">Pending Review</span>
              </div>
              <span className="font-semibold">{dashboard.summary.pendingReview}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-700">Disqualified</span>
              </div>
              <span className="font-semibold">{dashboard.summary.disqualified}</span>
            </div>
          </div>
        </div>

        {/* By Tier */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-gray-400" />
            Supplier Tiers
          </h3>
          <div className="space-y-3">
            {Object.entries(dashboard.byTier).map(([tier, count]) => {
              const total = Object.values(dashboard.byTier).reduce((a, b) => a + b, 0);
              const percentage = Math.round((count / total) * 100);
              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="capitalize text-gray-700">{tier}</span>
                    <span className="font-medium">{count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        tier === 'preferred' ? 'bg-purple-500' :
                        tier === 'approved' ? 'bg-green-500' :
                        tier === 'provisional' ? 'bg-yellow-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Risk Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(dashboard.byRiskLevel).map(([level, count]) => (
            <div 
              key={level}
              className={`p-4 rounded-lg ${riskConfig[level].bgColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium capitalize ${riskConfig[level].color}`}>{level}</span>
                <Shield className={`w-5 h-5 ${riskConfig[level].color}`} />
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-500">suppliers</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const SuppliersList = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Statuses</option>
            <option value="qualified">Qualified</option>
            <option value="conditionally_qualified">Conditional</option>
            <option value="in_review">In Review</option>
            <option value="pending">Pending</option>
            <option value="disqualified">Disqualified</option>
          </select>
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="space-y-4">
        {filteredQualifications.map((qualification) => (
          <div
            key={qualification._id}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedQualification(qualification);
              setShowDetailModal(true);
            }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Building2 className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {qualification.supplierName}
                    </h3>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[qualification.status].color}`}>
                      {statusConfig[qualification.status].icon}
                      {statusConfig[qualification.status].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${tierConfig[qualification.tier].color}`}>
                      {tierConfig[qualification.tier].label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{qualification.qualificationId}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Award className="w-4 h-4" />
                      {qualification.certifications.length} certifications
                    </span>
                    <span className={`flex items-center gap-1 ${riskConfig[qualification.overallRiskLevel].color}`}>
                      <Shield className="w-4 h-4" />
                      {qualification.overallRiskLevel} risk
                    </span>
                    {qualification.requalificationDue && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Requalification in {getDaysUntil(qualification.requalificationDue)} days
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className={`text-3xl font-bold ${getScoreColor(qualification.overallScore)}`}>
                  {qualification.overallScore || '-'}
                </p>
                <p className="text-xs text-gray-500">Overall Score</p>
                <ChevronRight className="w-5 h-5 text-gray-400 mt-2 ml-auto" />
              </div>
            </div>

            {/* Certification Pills */}
            {qualification.certifications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                {qualification.certifications.slice(0, 4).map((cert, index) => (
                  <span 
                    key={index}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                      cert.status === 'expired' ? 'bg-red-100 text-red-700' :
                      cert.status === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}
                  >
                    <Award className="w-3 h-3" />
                    {cert.name}
                  </span>
                ))}
                {qualification.certifications.length > 4 && (
                  <span className="text-xs text-gray-500">
                    +{qualification.certifications.length - 4} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}

        {filteredQualifications.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );

  const AlertsPanel = () => {
    const expiringCerts = qualifications.flatMap(q => 
      q.certifications
        .filter(c => c.status === 'expiring_soon' || c.status === 'expired')
        .map(c => ({ supplier: q.supplierName, supplierId: q.supplierId, ...c }))
    );

    const upcomingRequalifications = qualifications
      .filter(q => q.requalificationDue && getDaysUntil(q.requalificationDue) <= 60)
      .sort((a, b) => getDaysUntil(a.requalificationDue!) - getDaysUntil(b.requalificationDue!));

    return (
      <div className="space-y-6">
        {/* Expiring Certifications */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-orange-500" />
              Expiring Certifications
            </h3>
          </div>
          <div className="divide-y">
            {expiringCerts.length > 0 ? (
              expiringCerts.map((cert, index) => (
                <div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{cert.name}</p>
                    <p className="text-sm text-gray-500">{cert.supplier}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      cert.status === 'expired' ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {cert.status === 'expired' ? 'Expired' : `Expires ${formatDate(cert.validUntil)}`}
                    </p>
                    <p className="text-xs text-gray-500">Issued by {cert.issuer}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No expiring certifications
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Requalifications */}
        <div className="bg-white rounded-xl shadow-sm border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              Upcoming Requalifications
            </h3>
          </div>
          <div className="divide-y">
            {upcomingRequalifications.length > 0 ? (
              upcomingRequalifications.map((q) => (
                <div key={q._id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{q.supplierName}</p>
                    <p className="text-sm text-gray-500">{q.qualificationId}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      getDaysUntil(q.requalificationDue!) <= 30 ? 'text-red-600' : 'text-yellow-600'
                    }`}>
                      {getDaysUntil(q.requalificationDue!)} days remaining
                    </p>
                    <p className="text-xs text-gray-500">Due {formatDate(q.requalificationDue!)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No upcoming requalifications
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Supplier Qualification</h1>
              <p className="text-gray-500 mt-1">Manage supplier compliance and qualifications</p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
              <Plus className="w-5 h-5" />
              New Qualification
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'suppliers'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Suppliers
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'alerts'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 inline mr-2" />
              Alerts
              {(dashboard.expiringCertifications + dashboard.upcomingRequalifications) > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {dashboard.expiringCertifications + dashboard.upcomingRequalifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewDashboard />}
        {activeTab === 'suppliers' && <SuppliersList />}
        {activeTab === 'alerts' && <AlertsPanel />}
      </div>

      {/* Detail Modal */}
      {showDetailModal && <DetailModal />}
    </div>
  );
};

export default SupplierQualificationPage;
