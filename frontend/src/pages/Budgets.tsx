// frontend/src/pages/Budgets.tsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  BarChart3,
  Calendar,
  Plus,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Leaf,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  Filter,
  Search,
  Download
} from 'lucide-react';

interface BudgetCategory {
  id: string;
  name: string;
  budgeted: number;
  spent: number;
  remaining: number;
  utilizationPercentage: number;
}

interface Budget {
  _id: string;
  budgetId: string;
  name: string;
  description?: string;
  fiscalYear: number;
  type: 'annual' | 'quarterly' | 'monthly' | 'project';
  status: 'draft' | 'pending_approval' | 'approved' | 'active' | 'closed';
  currency: string;
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  categories: Array<{ id: string; name: string }>;
  sustainabilityAllocation?: {
    percentage: number;
    amount: number;
  };
  createdAt: string;
}

interface Expense {
  _id: string;
  expenseId: string;
  budgetId: string;
  categoryId: string;
  description: string;
  amount: number;
  currency: string;
  vendor?: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  sustainabilityImpact?: {
    isGreenPurchase: boolean;
    carbonSavings?: number;
  };
  createdAt: string;
}

interface BudgetAlert {
  type: 'warning' | 'critical';
  message: string;
  category?: string;
  utilizationPercentage: number;
}

interface BudgetSummary {
  totalBudgeted: number;
  totalSpent: number;
  totalRemaining: number;
  utilizationPercentage: number;
  categoryBreakdown: BudgetCategory[];
  monthlyTrend: Array<{ month: string; budgeted: number; spent: number }>;
  sustainabilitySpend: {
    total: number;
    percentage: number;
    greenPurchases: number;
  };
}

// Mock data
const mockBudgets: Budget[] = [
  {
    _id: '1',
    budgetId: 'BUD-M1K2N3-AB12',
    name: 'FY2024 Procurement Budget',
    description: 'Annual budget for sustainable materials procurement',
    fiscalYear: 2024,
    type: 'annual',
    status: 'active',
    currency: 'USD',
    totalPlanned: 2500000,
    totalActual: 1875000,
    totalVariance: 625000,
    categories: [
      { id: 'cat-1', name: 'Raw Materials' },
      { id: 'cat-2', name: 'Equipment' },
      { id: 'cat-3', name: 'Services' },
      { id: 'cat-4', name: 'Sustainability Initiatives' },
    ],
    sustainabilityAllocation: { percentage: 25, amount: 625000 },
    createdAt: new Date(2024, 0, 1).toISOString(),
  },
  {
    _id: '2',
    budgetId: 'BUD-P4Q5R6-CD34',
    name: 'Q2 2024 Operations',
    description: 'Quarterly operational budget',
    fiscalYear: 2024,
    type: 'quarterly',
    status: 'approved',
    currency: 'USD',
    totalPlanned: 450000,
    totalActual: 385000,
    totalVariance: 65000,
    categories: [
      { id: 'cat-5', name: 'Operations' },
      { id: 'cat-6', name: 'Maintenance' },
    ],
    createdAt: new Date(2024, 3, 1).toISOString(),
  },
  {
    _id: '3',
    budgetId: 'BUD-S7T8U9-EF56',
    name: 'Green Building Project',
    description: 'Budget for LEED-certified building materials',
    fiscalYear: 2024,
    type: 'project',
    status: 'pending_approval',
    currency: 'USD',
    totalPlanned: 750000,
    totalActual: 0,
    totalVariance: 750000,
    categories: [
      { id: 'cat-7', name: 'Construction Materials' },
      { id: 'cat-8', name: 'Certifications' },
    ],
    sustainabilityAllocation: { percentage: 100, amount: 750000 },
    createdAt: new Date(2024, 5, 15).toISOString(),
  },
];

const mockSummary: BudgetSummary = {
  totalBudgeted: 3700000,
  totalSpent: 2260000,
  totalRemaining: 1440000,
  utilizationPercentage: 61,
  categoryBreakdown: [
    { id: 'cat-1', name: 'Raw Materials', budgeted: 1200000, spent: 925000, remaining: 275000, utilizationPercentage: 77 },
    { id: 'cat-2', name: 'Equipment', budgeted: 800000, spent: 650000, remaining: 150000, utilizationPercentage: 81 },
    { id: 'cat-3', name: 'Services', budgeted: 400000, spent: 285000, remaining: 115000, utilizationPercentage: 71 },
    { id: 'cat-4', name: 'Sustainability', budgeted: 625000, spent: 400000, remaining: 225000, utilizationPercentage: 64 },
  ],
  monthlyTrend: [
    { month: 'Jan', budgeted: 308333, spent: 295000 },
    { month: 'Feb', budgeted: 308333, spent: 312000 },
    { month: 'Mar', budgeted: 308333, spent: 289000 },
    { month: 'Apr', budgeted: 308333, spent: 345000 },
    { month: 'May', budgeted: 308333, spent: 378000 },
    { month: 'Jun', budgeted: 308333, spent: 341000 },
    { month: 'Jul', budgeted: 308333, spent: 300000 },
  ],
  sustainabilitySpend: {
    total: 568000,
    percentage: 25,
    greenPurchases: 142,
  },
};

const mockExpenses: Expense[] = [
  {
    _id: '1',
    expenseId: 'EXP-001',
    budgetId: 'BUD-M1K2N3-AB12',
    categoryId: 'cat-1',
    description: 'Recycled steel beams - Q2 order',
    amount: 45000,
    currency: 'USD',
    vendor: 'EcoSteel Corp',
    status: 'approved',
    sustainabilityImpact: { isGreenPurchase: true, carbonSavings: 2500 },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '2',
    expenseId: 'EXP-002',
    budgetId: 'BUD-M1K2N3-AB12',
    categoryId: 'cat-4',
    description: 'Carbon offset credits - H1 2024',
    amount: 12500,
    currency: 'USD',
    vendor: 'CarbonClear',
    status: 'pending',
    sustainabilityImpact: { isGreenPurchase: true, carbonSavings: 500 },
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    _id: '3',
    expenseId: 'EXP-003',
    budgetId: 'BUD-M1K2N3-AB12',
    categoryId: 'cat-2',
    description: 'Solar panel installation equipment',
    amount: 85000,
    currency: 'USD',
    vendor: 'SolarTech Solutions',
    status: 'paid',
    sustainabilityImpact: { isGreenPurchase: true, carbonSavings: 15000 },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const mockAlerts: BudgetAlert[] = [
  { type: 'warning', message: 'Equipment budget at 81% utilization', category: 'Equipment', utilizationPercentage: 81 },
  { type: 'critical', message: 'Raw Materials approaching budget limit', category: 'Raw Materials', utilizationPercentage: 77 },
];

const statusConfig: Record<Budget['status'], { label: string; color: string }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800' },
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-800' },
  active: { label: 'Active', color: 'bg-green-100 text-green-800' },
  closed: { label: 'Closed', color: 'bg-gray-100 text-gray-600' },
};

const expenseStatusConfig: Record<Expense['status'], { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  paid: { label: 'Paid', color: 'bg-blue-100 text-blue-800' },
};

const Budgets: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>(mockBudgets);
  const [summary, setSummary] = useState<BudgetSummary>(mockSummary);
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);
  const [alerts, setAlerts] = useState<BudgetAlert[]>(mockAlerts);
  const [activeTab, setActiveTab] = useState<'overview' | 'budgets' | 'expenses'>('overview');
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Would fetch data from API
  }, []);

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const OverviewDashboard = () => (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${
                alert.type === 'critical'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <AlertTriangle
                  className={`w-5 h-5 ${
                    alert.type === 'critical' ? 'text-red-600' : 'text-yellow-600'
                  }`}
                />
                <div className="flex-1">
                  <p className={`font-medium ${
                    alert.type === 'critical' ? 'text-red-800' : 'text-yellow-800'
                  }`}>
                    {alert.message}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  alert.type === 'critical' ? 'bg-red-200 text-red-800' : 'bg-yellow-200 text-yellow-800'
                }`}>
                  {alert.utilizationPercentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalBudgeted)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">FY 2024</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Spent YTD</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalSpent)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2">
            <ArrowUpRight className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-600">8.5% vs last month</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalRemaining)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Target className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {100 - summary.utilizationPercentage}% available
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Green Spend</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.sustainabilitySpend.total)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">
            {summary.sustainabilitySpend.percentage}% of total spend
          </p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Utilization */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-gray-400" />
            Budget Utilization by Category
          </h3>
          <div className="space-y-4">
            {summary.categoryBreakdown.map((category) => (
              <div key={category.id}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {category.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                      {formatCurrency(category.spent)} / {formatCurrency(category.budgeted)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getUtilizationColor(category.utilizationPercentage)}`}>
                      {category.utilizationPercentage}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${getProgressColor(category.utilizationPercentage)}`}
                    style={{ width: `${Math.min(category.utilizationPercentage, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Monthly Spending Trend
          </h3>
          <div className="flex items-end justify-between h-48 gap-2">
            {summary.monthlyTrend.map((month) => {
              const maxValue = Math.max(...summary.monthlyTrend.map(m => Math.max(m.budgeted, m.spent)));
              const budgetHeight = (month.budgeted / maxValue) * 100;
              const spentHeight = (month.spent / maxValue) * 100;
              
              return (
                <div key={month.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex gap-1 items-end h-40">
                    <div 
                      className="flex-1 bg-gray-200 rounded-t"
                      style={{ height: `${budgetHeight}%` }}
                    />
                    <div 
                      className={`flex-1 rounded-t ${month.spent > month.budgeted ? 'bg-red-400' : 'bg-green-400'}`}
                      style={{ height: `${spentHeight}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{month.month}</span>
                </div>
              );
            })}
          </div>
          <div className="flex justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded" />
              <span className="text-xs text-gray-500">Budget</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded" />
              <span className="text-xs text-gray-500">Spent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sustainability Impact */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold">Sustainability Impact</h3>
            <p className="opacity-90">Green procurement initiatives</p>
          </div>
          <Leaf className="w-10 h-10 opacity-50" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-3xl font-bold">{formatCurrency(summary.sustainabilitySpend.total)}</p>
            <p className="opacity-75">Green Purchases Value</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{summary.sustainabilitySpend.greenPurchases}</p>
            <p className="opacity-75">Sustainable Transactions</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{summary.sustainabilitySpend.percentage}%</p>
            <p className="opacity-75">of Total Spend</p>
          </div>
        </div>
      </div>
    </div>
  );

  const BudgetsList = () => (
    <div className="space-y-4">
      {budgets.map((budget) => {
        const utilization = budget.totalPlanned > 0 
          ? Math.round((budget.totalActual / budget.totalPlanned) * 100)
          : 0;
        
        return (
          <div
            key={budget._id}
            className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{budget.name}</h3>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[budget.status].color}`}>
                    {statusConfig[budget.status].label}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{budget.description}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    FY {budget.fiscalYear}
                  </span>
                  <span className="capitalize">{budget.type}</span>
                  <span>{budget.budgetId}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Eye className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <Edit className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-500 uppercase">Planned</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.totalPlanned, budget.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Spent</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(budget.totalActual, budget.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Remaining</p>
                <p className={`text-lg font-semibold ${budget.totalVariance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(budget.totalVariance, budget.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase">Utilization</p>
                <p className={`text-lg font-semibold ${
                  utilization >= 90 ? 'text-red-600' :
                  utilization >= 75 ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {utilization}%
                </p>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getProgressColor(utilization)}`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>

            {budget.sustainabilityAllocation && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm text-green-600">
                <Leaf className="w-4 h-4" />
                <span>
                  {budget.sustainabilityAllocation.percentage}% sustainability allocation
                  ({formatCurrency(budget.sustainabilityAllocation.amount, budget.currency)})
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const ExpensesList = () => {
    const filteredExpenses = expenses.filter(expense =>
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.expenseId.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expense</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredExpenses.map((expense) => (
                <tr key={expense._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {expense.sustainabilityImpact?.isGreenPurchase && (
                        <Leaf className="w-4 h-4 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{expense.description}</p>
                        <p className="text-xs text-gray-500">{expense.expenseId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{expense.vendor || '-'}</td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {formatCurrency(expense.amount, expense.currency)}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${expenseStatusConfig[expense.status].color}`}>
                      {expenseStatusConfig[expense.status].label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(expense.createdAt)}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {expense.status === 'pending' && (
                        <>
                          <button className="p-1 text-green-600 hover:bg-green-50 rounded">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                          <button className="p-1 text-red-600 hover:bg-red-50 rounded">
                            <XCircle className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      <button className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
              <p className="text-gray-500 mt-1">Plan, track, and optimize your procurement spending</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Budget
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
              onClick={() => setActiveTab('budgets')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'budgets'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Budgets
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'expenses'
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Expenses
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && <OverviewDashboard />}
        {activeTab === 'budgets' && <BudgetsList />}
        {activeTab === 'expenses' && <ExpensesList />}
      </div>
    </div>
  );
};

export default Budgets;
