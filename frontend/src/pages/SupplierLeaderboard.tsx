import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Star,
  TrendingUp,
  Award,
  Crown,
  Leaf,
  Package,
  Clock,
  ChevronDown,
  Search,
  Filter,
  ExternalLink,
  Shield,
  Zap,
  Target,
  RefreshCw,
} from 'lucide-react';
import DashboardSidebar from '../components/DashboardSidebar';

interface SupplierRanking {
  rank: number;
  supplierId: string;
  name: string;
  company: string;
  overallScore: number;
  tier: 'platinum' | 'gold' | 'silver' | 'bronze' | 'new';
  scores: {
    quality: number;
    delivery: number;
    responsiveness: number;
    sustainability: number;
    value: number;
  };
  badges: string[];
  change?: number;
  avatar?: string;
}

const SupplierLeaderboard: React.FC = () => {
  const [suppliers, setSuppliers] = useState<SupplierRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('overall');

  useEffect(() => {
    // Mock data
    const mockSuppliers: SupplierRanking[] = [
      {
        rank: 1,
        supplierId: '1',
        name: 'Sarah Chen',
        company: 'EcoMaterials Inc',
        overallScore: 96,
        tier: 'platinum',
        scores: { quality: 98, delivery: 95, responsiveness: 92, sustainability: 99, value: 94 },
        badges: ['eco-champion', 'on-time-delivery', 'quality-assured', 'highly-reviewed'],
        change: 0,
      },
      {
        rank: 2,
        supplierId: '2',
        name: 'Mike Johnson',
        company: 'GreenBuilders Ltd',
        overallScore: 93,
        tier: 'platinum',
        scores: { quality: 95, delivery: 92, responsiveness: 90, sustainability: 94, value: 93 },
        badges: ['eco-champion', 'quality-assured', 'highly-reviewed'],
        change: 1,
      },
      {
        rank: 3,
        supplierId: '3',
        name: 'Lisa Park',
        company: 'SustainableSteel Co',
        overallScore: 89,
        tier: 'gold',
        scores: { quality: 90, delivery: 88, responsiveness: 85, sustainability: 92, value: 90 },
        badges: ['on-time-delivery', 'eco-champion'],
        change: -1,
      },
      {
        rank: 4,
        supplierId: '4',
        name: 'Tom Wilson',
        company: 'BambooWorld',
        overallScore: 87,
        tier: 'gold',
        scores: { quality: 88, delivery: 85, responsiveness: 88, sustainability: 90, value: 86 },
        badges: ['eco-champion', 'highly-reviewed'],
        change: 2,
      },
      {
        rank: 5,
        supplierId: '5',
        name: 'Anna Martinez',
        company: 'RecycledConcrete Pro',
        overallScore: 84,
        tier: 'gold',
        scores: { quality: 85, delivery: 82, responsiveness: 80, sustainability: 88, value: 86 },
        badges: ['eco-champion'],
        change: 0,
      },
      {
        rank: 6,
        supplierId: '6',
        name: 'David Lee',
        company: 'SolarPanels Direct',
        overallScore: 81,
        tier: 'gold',
        scores: { quality: 82, delivery: 80, responsiveness: 78, sustainability: 85, value: 82 },
        badges: ['on-time-delivery'],
        change: -2,
      },
      {
        rank: 7,
        supplierId: '7',
        name: 'Emma Thompson',
        company: 'FSC Wood Supplies',
        overallScore: 76,
        tier: 'silver',
        scores: { quality: 78, delivery: 75, responsiveness: 72, sustainability: 80, value: 77 },
        badges: ['eco-champion'],
        change: 1,
      },
      {
        rank: 8,
        supplierId: '8',
        name: 'James Brown',
        company: 'GreenInsulation Co',
        overallScore: 72,
        tier: 'silver',
        scores: { quality: 74, delivery: 70, responsiveness: 68, sustainability: 76, value: 74 },
        badges: [],
        change: -1,
      },
      {
        rank: 9,
        supplierId: '9',
        name: 'Rachel Green',
        company: 'EcoGlass Solutions',
        overallScore: 68,
        tier: 'silver',
        scores: { quality: 70, delivery: 65, responsiveness: 65, sustainability: 72, value: 70 },
        badges: [],
        change: 0,
      },
      {
        rank: 10,
        supplierId: '10',
        name: 'New Supplier',
        company: 'Fresh Materials LLC',
        overallScore: 0,
        tier: 'new',
        scores: { quality: 0, delivery: 0, responsiveness: 0, sustainability: 0, value: 0 },
        badges: [],
        change: undefined,
      },
    ];

    setSuppliers(mockSuppliers);
    setLoading(false);
  }, []);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'platinum':
        return 'from-indigo-400 to-purple-500';
      case 'gold':
        return 'from-amber-400 to-yellow-500';
      case 'silver':
        return 'from-gray-300 to-gray-400';
      case 'bronze':
        return 'from-orange-400 to-amber-600';
      default:
        return 'from-gray-200 to-gray-300';
    }
  };

  const getTierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      platinum: 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white',
      gold: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
      silver: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white',
      bronze: 'bg-gradient-to-r from-orange-400 to-amber-600 text-white',
      new: 'bg-gray-100 text-gray-600',
    };
    return colors[tier] || colors.new;
  };

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'eco-champion':
        return <Leaf className="w-3 h-3" />;
      case 'on-time-delivery':
        return <Clock className="w-3 h-3" />;
      case 'quality-assured':
        return <Shield className="w-3 h-3" />;
      case 'highly-reviewed':
        return <Star className="w-3 h-3" />;
      default:
        return <Award className="w-3 h-3" />;
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-amber-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-orange-400" />;
    return null;
  };

  const filteredSuppliers = suppliers
    .filter(s => selectedTier === 'all' || s.tier === selectedTier)
    .filter(s => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(query) || s.company.toLowerCase().includes(query);
    });

  const tierStats = suppliers.reduce((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar />
      
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-amber-500" />
              Supplier Leaderboard
            </h1>
            <p className="text-gray-500 mt-1">Top performing suppliers ranked by quality, delivery, and sustainability</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Tier Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { tier: 'platinum', label: 'Platinum', icon: Crown, score: '90+' },
            { tier: 'gold', label: 'Gold', icon: Medal, score: '75-89' },
            { tier: 'silver', label: 'Silver', icon: Award, score: '60-74' },
            { tier: 'bronze', label: 'Bronze', icon: Shield, score: '<60' },
            { tier: 'new', label: 'New', icon: Zap, score: 'N/A' },
          ].map(({ tier, label, icon: Icon, score }) => (
            <div
              key={tier}
              onClick={() => setSelectedTier(selectedTier === tier ? 'all' : tier)}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 cursor-pointer transition-all ${
                selectedTier === tier ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-gradient-to-br ${getTierColor(tier)}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className="text-xl font-bold">{tierStats[tier] || 0}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">Score: {score}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search suppliers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg bg-white"
          >
            <option value="overall">Sort by Overall Score</option>
            <option value="quality">Sort by Quality</option>
            <option value="delivery">Sort by Delivery</option>
            <option value="sustainability">Sort by Sustainability</option>
          </select>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredSuppliers.map((supplier) => (
                <div
                  key={supplier.supplierId}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    supplier.rank <= 3 ? 'bg-gradient-to-r from-amber-50/50 to-transparent' : ''
                  }`}
                >
                  <div className="flex items-center gap-6">
                    {/* Rank */}
                    <div className="w-16 text-center">
                      {getRankIcon(supplier.rank) || (
                        <span className="text-2xl font-bold text-gray-400">#{supplier.rank}</span>
                      )}
                      {supplier.change !== undefined && supplier.change !== 0 && (
                        <div className={`text-xs mt-1 ${supplier.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {supplier.change > 0 ? '↑' : '↓'} {Math.abs(supplier.change)}
                        </div>
                      )}
                    </div>

                    {/* Avatar & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${getTierColor(supplier.tier)} flex items-center justify-center text-white font-bold text-lg`}>
                        {supplier.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${getTierBadge(supplier.tier)}`}>
                            {supplier.tier}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{supplier.company}</p>
                        {supplier.badges.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            {supplier.badges.slice(0, 4).map((badge) => (
                              <span
                                key={badge}
                                className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-green-50 text-green-700 rounded"
                                title={badge.replace('-', ' ')}
                              >
                                {getBadgeIcon(badge)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="hidden lg:flex items-center gap-6">
                      {[
                        { label: 'Quality', value: supplier.scores.quality, icon: Shield },
                        { label: 'Delivery', value: supplier.scores.delivery, icon: Clock },
                        { label: 'Response', value: supplier.scores.responsiveness, icon: Zap },
                        { label: 'Sustain', value: supplier.scores.sustainability, icon: Leaf },
                      ].map((score) => (
                        <div key={score.label} className="text-center">
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-500 mb-1">
                            <score.icon className="w-3 h-3" />
                            {score.label}
                          </div>
                          <div className="font-semibold">{score.value || '-'}</div>
                        </div>
                      ))}
                    </div>

                    {/* Overall Score */}
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">
                        {supplier.overallScore || '-'}
                      </div>
                      <div className="text-xs text-gray-500">Overall Score</div>
                    </div>

                    {/* View Profile */}
                    <button className="p-2 hover:bg-gray-100 rounded-lg">
                      <ExternalLink className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredSuppliers.length === 0 && (
                <div className="py-20 text-center">
                  <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No suppliers found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold mb-4">Score Components</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <span>Quality (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-600" />
              <span>Delivery (25%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Response (15%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span>Sustainability (20%)</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-600" />
              <span>Value (15%)</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SupplierLeaderboard;
