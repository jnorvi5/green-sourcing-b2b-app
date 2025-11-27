/**
 * Carbon Analytics Dashboard
 * 
 * Visualizes carbon footprint data across projects
 * with charts, benchmarks, and recommendations
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ChartBarIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  GlobeAltIcon,
  LightBulbIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';

interface ProjectCarbon {
  id: string;
  name: string;
  totalGwp: number;
  materialCount: number;
  benchmark: number;
  status: 'on-track' | 'at-risk' | 'exceeded';
  breakdown: {
    category: string;
    gwp: number;
    percentage: number;
  }[];
}

interface MonthlyTrend {
  month: string;
  gwp: number;
  projects: number;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  potentialSavings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

// Mock data
const MOCK_PROJECTS: ProjectCarbon[] = [
  {
    id: 'proj-1',
    name: 'Downtown Office Tower',
    totalGwp: 2450,
    materialCount: 24,
    benchmark: 3000,
    status: 'on-track',
    breakdown: [
      { category: 'Concrete', gwp: 980, percentage: 40 },
      { category: 'Steel', gwp: 735, percentage: 30 },
      { category: 'Glass', gwp: 490, percentage: 20 },
      { category: 'Other', gwp: 245, percentage: 10 },
    ],
  },
  {
    id: 'proj-2',
    name: 'Eco Residence',
    totalGwp: 420,
    materialCount: 12,
    benchmark: 500,
    status: 'on-track',
    breakdown: [
      { category: 'Wood', gwp: 126, percentage: 30 },
      { category: 'Insulation', gwp: 84, percentage: 20 },
      { category: 'Concrete', gwp: 168, percentage: 40 },
      { category: 'Other', gwp: 42, percentage: 10 },
    ],
  },
  {
    id: 'proj-3',
    name: 'Industrial Warehouse',
    totalGwp: 1850,
    materialCount: 8,
    benchmark: 1500,
    status: 'exceeded',
    breakdown: [
      { category: 'Steel', gwp: 1110, percentage: 60 },
      { category: 'Concrete', gwp: 555, percentage: 30 },
      { category: 'Other', gwp: 185, percentage: 10 },
    ],
  },
];

const MOCK_TRENDS: MonthlyTrend[] = [
  { month: 'Jun', gwp: 3200, projects: 2 },
  { month: 'Jul', gwp: 2800, projects: 3 },
  { month: 'Aug', gwp: 3500, projects: 4 },
  { month: 'Sep', gwp: 2900, projects: 3 },
  { month: 'Oct', gwp: 2600, projects: 3 },
  { month: 'Nov', gwp: 2450, projects: 3 },
];

const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    id: 'rec-1',
    title: 'Switch to EAF Recycled Steel',
    description: 'Replace virgin steel with recycled EAF steel to reduce embodied carbon by up to 62%',
    potentialSavings: 456,
    difficulty: 'easy',
    category: 'Steel',
  },
  {
    id: 'rec-2',
    title: 'Use Low-Carbon Concrete Mix',
    description: 'Specify concrete with 30% SCM (fly ash/slag) for foundations',
    potentialSavings: 294,
    difficulty: 'easy',
    category: 'Concrete',
  },
  {
    id: 'rec-3',
    title: 'Consider Mass Timber Structure',
    description: 'CLT panels can replace steel framing in mid-rise buildings',
    potentialSavings: 680,
    difficulty: 'hard',
    category: 'Structural',
  },
];

export default function CarbonAnalytics() {
  const [projects, setProjects] = useState<ProjectCarbon[]>([]);
  const [trends, setTrends] = useState<MonthlyTrend[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'30d' | '90d' | '1y'>('90d');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProjects(MOCK_PROJECTS);
      setTrends(MOCK_TRENDS);
      setRecommendations(MOCK_RECOMMENDATIONS);
      setLoading(false);
    }, 500);
  }, []);

  const totalGwp = projects.reduce((sum, p) => sum + p.totalGwp, 0);
  const totalBenchmark = projects.reduce((sum, p) => sum + p.benchmark, 0);
  const savingsPercent = Math.round(((totalBenchmark - totalGwp) / totalBenchmark) * 100);
  const totalMaterials = projects.reduce((sum, p) => sum + p.materialCount, 0);

  // Calculate max for chart scaling
  const maxTrendGwp = Math.max(...trends.map(t => t.gwp));

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ChartBarIcon className="w-8 h-8 text-green-600" />
              Carbon Analytics
            </h1>
            <p className="text-muted-foreground mt-1">
              Track and optimize your project carbon footprints
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex gap-3">
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value as typeof dateRange)}
              className="px-3 py-2 bg-background border border-border rounded-lg"
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              <DocumentArrowDownIcon className="w-5 h-5" />
              Export Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Total Carbon</div>
              <GlobeAltIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground mt-2">
              {totalGwp.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">kg CO2e</div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">vs Benchmark</div>
              <ArrowTrendingDownIcon className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              -{savingsPercent}%
            </div>
            <div className="text-sm text-muted-foreground">below average</div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Active Projects</div>
              <BuildingOffice2Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground mt-2">{projects.length}</div>
            <div className="text-sm text-muted-foreground">being tracked</div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">Materials</div>
              <LightBulbIcon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-3xl font-bold text-foreground mt-2">{totalMaterials}</div>
            <div className="text-sm text-muted-foreground">low-carbon choices</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 cols */}
          <div className="lg:col-span-2 space-y-8">
            {/* Trend Chart */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Carbon Trend
              </h2>
              
              {/* Simple bar chart */}
              <div className="h-64 flex items-end justify-between gap-2 px-4">
                {trends.map((trend, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div
                      className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500"
                      style={{ height: `${(trend.gwp / maxTrendGwp) * 200}px` }}
                      title={`${trend.gwp} kg CO2e`}
                    ></div>
                    <div className="text-xs text-muted-foreground mt-2">{trend.month}</div>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-500"></div>
                  <span className="text-sm text-muted-foreground">Monthly Carbon (kg CO2e)</span>
                </div>
              </div>
            </div>

            {/* Projects Table */}
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Projects Overview</h2>
                <Link to="/dashboard/buyer/projects" className="text-sm text-primary hover:underline">
                  View all →
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Project</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Total GWP</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Benchmark</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map(project => {
                      const progress = (project.totalGwp / project.benchmark) * 100;
                      return (
                        <tr key={project.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-4 px-2">
                            <Link
                              to={`/dashboard/buyer/projects/${project.id}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {project.name}
                            </Link>
                            <div className="text-sm text-muted-foreground">
                              {project.materialCount} materials
                            </div>
                          </td>
                          <td className="text-right py-4 px-2 font-medium text-foreground">
                            {project.totalGwp.toLocaleString()}
                          </td>
                          <td className="text-right py-4 px-2 text-muted-foreground">
                            {project.benchmark.toLocaleString()}
                          </td>
                          <td className="text-center py-4 px-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              project.status === 'on-track'
                                ? 'bg-green-100 text-green-800'
                                : project.status === 'at-risk'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {project.status === 'on-track' ? 'On Track' : 
                               project.status === 'at-risk' ? 'At Risk' : 'Exceeded'}
                            </span>
                          </td>
                          <td className="py-4 px-2">
                            <div className="flex items-center gap-2 justify-end">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    progress <= 80 ? 'bg-green-500' :
                                    progress <= 100 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(progress, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12 text-right">
                                {Math.round(progress)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 col */}
          <div className="space-y-8">
            {/* Category Breakdown */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Carbon by Category</h2>
              
              {(() => {
                // Aggregate all categories
                const categoryTotals: Record<string, number> = {};
                projects.forEach(p => {
                  p.breakdown.forEach(b => {
                    categoryTotals[b.category] = (categoryTotals[b.category] || 0) + b.gwp;
                  });
                });
                const categories = Object.entries(categoryTotals)
                  .sort((a, b) => b[1] - a[1]);
                const maxCat = categories[0]?.[1] || 1;
                
                const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
                
                return (
                  <div className="space-y-3">
                    {categories.map(([name, gwp], i) => (
                      <div key={name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-foreground">{name}</span>
                          <span className="text-muted-foreground">{gwp.toLocaleString()} kg</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[i % colors.length]}`}
                            style={{ width: `${(gwp / maxCat) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Recommendations */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <LightBulbIcon className="w-5 h-5 text-yellow-500" />
                Recommendations
              </h2>
              
              <div className="space-y-4">
                {recommendations.map(rec => (
                  <div
                    key={rec.id}
                    className="p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <h3 className="font-medium text-foreground">{rec.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        rec.difficulty === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : rec.difficulty === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {rec.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{rec.description}</p>
                    <div className="mt-2 text-sm font-medium text-green-600">
                      Save up to {rec.potentialSavings} kg CO2e
                    </div>
                  </div>
                ))}
              </div>
              
              <Link
                to="/search?lowCarbon=true"
                className="block mt-4 text-center text-sm text-primary hover:underline"
              >
                Browse low-carbon alternatives →
              </Link>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
              <h3 className="font-semibold text-foreground mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <Link
                  to="/dashboard/buyer/projects"
                  className="block w-full px-4 py-2 bg-white border border-green-200 rounded-lg text-sm hover:bg-green-50 transition-colors"
                >
                  Create New Project
                </Link>
                <button className="w-full px-4 py-2 bg-white border border-green-200 rounded-lg text-sm hover:bg-green-50 transition-colors">
                  Import BIM Model
                </button>
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:bg-primary/90 transition-colors">
                  Generate LEED Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
