/**
 * Reports Page
 *
 * Generate and download carbon reports, procurement analytics, and compliance documents
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    DocumentArrowDownIcon,
    ChartBarIcon,
    TableCellsIcon,
    DocumentTextIcon,
    CalendarIcon,
    BuildingOfficeIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ClockIcon,
    FolderIcon,
} from '@heroicons/react/24/outline';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    icon: typeof DocumentTextIcon;
    category: 'carbon' | 'procurement' | 'compliance';
    formats: string[];
    estimatedTime: string;
}

interface GeneratedReport {
    id: string;
    name: string;
    type: string;
    format: string;
    generatedAt: string;
    size: string;
    status: 'ready' | 'generating' | 'failed';
}

const REPORT_TEMPLATES: ReportTemplate[] = [
    {
        id: 'carbon-summary',
        name: 'Carbon Footprint Summary',
        description: 'Overview of embodied carbon across all procured materials with trends and recommendations.',
        icon: ChartBarIcon,
        category: 'carbon',
        formats: ['PDF', 'Excel'],
        estimatedTime: '~2 min',
    },
    {
        id: 'epd-compilation',
        name: 'EPD Compilation Report',
        description: 'Compiled Environmental Product Declarations for all materials in your projects.',
        icon: FolderIcon,
        category: 'compliance',
        formats: ['PDF', 'ZIP'],
        estimatedTime: '~5 min',
    },
    {
        id: 'material-breakdown',
        name: 'Material Carbon Breakdown',
        description: 'Detailed breakdown of carbon by material type, supplier, and project.',
        icon: TableCellsIcon,
        category: 'carbon',
        formats: ['PDF', 'Excel', 'CSV'],
        estimatedTime: '~3 min',
    },
    {
        id: 'leed-documentation',
        name: 'LEED Documentation Package',
        description: 'Pre-formatted documentation for LEED MR credits including EPDs and recycled content.',
        icon: DocumentTextIcon,
        category: 'compliance',
        formats: ['PDF', 'ZIP'],
        estimatedTime: '~10 min',
    },
    {
        id: 'procurement-summary',
        name: 'Procurement Summary',
        description: 'Summary of all procurement activities, orders, and spending by category.',
        icon: ChartBarIcon,
        category: 'procurement',
        formats: ['PDF', 'Excel'],
        estimatedTime: '~2 min',
    },
    {
        id: 'supplier-performance',
        name: 'Supplier Performance Report',
        description: 'Evaluation of supplier performance including delivery, quality, and sustainability metrics.',
        icon: BuildingOfficeIcon,
        category: 'procurement',
        formats: ['PDF', 'Excel'],
        estimatedTime: '~3 min',
    },
];

const RECENT_REPORTS: GeneratedReport[] = [
    {
        id: '1',
        name: 'Q4 2023 Carbon Summary',
        type: 'Carbon Footprint Summary',
        format: 'PDF',
        generatedAt: '2024-01-15T10:30:00Z',
        size: '2.4 MB',
        status: 'ready',
    },
    {
        id: '2',
        name: 'Riverside Project EPDs',
        type: 'EPD Compilation Report',
        format: 'ZIP',
        generatedAt: '2024-01-12T14:15:00Z',
        size: '15.8 MB',
        status: 'ready',
    },
    {
        id: '3',
        name: 'January 2024 Procurement',
        type: 'Procurement Summary',
        format: 'Excel',
        generatedAt: '2024-01-10T09:00:00Z',
        size: '1.1 MB',
        status: 'ready',
    },
];

export function Reports() {
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [generating, setGenerating] = useState<string | null>(null);
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);

    // Report configuration state
    const [reportConfig, setReportConfig] = useState({
        dateRange: 'last-quarter',
        projects: 'all',
        format: 'PDF',
        includeCharts: true,
        includeRawData: false,
    });

    const filteredTemplates =
        selectedCategory === 'all'
            ? REPORT_TEMPLATES
            : REPORT_TEMPLATES.filter((t) => t.category === selectedCategory);

    const handleGenerateReport = async (template: ReportTemplate) => {
        setSelectedTemplate(template);
        setShowConfigModal(true);
    };

    const startGeneration = async () => {
        if (!selectedTemplate) return;

        setShowConfigModal(false);
        setGenerating(selectedTemplate.id);

        // Simulate report generation
        await new Promise((resolve) => setTimeout(resolve, 3000));

        setGenerating(null);
        // In real app, would add to recent reports
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            {/* Header */}
            <header className="border-b border-gray-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Reports</h1>
                        <p className="text-gray-400">Generate carbon, procurement, and compliance reports</p>
                    </div>
                    <Link
                        to="/dashboard/buyer"
                        className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Category Filter */}
                <div className="flex gap-2 mb-8">
                    {[
                        { value: 'all', label: 'All Reports' },
                        { value: 'carbon', label: 'Carbon' },
                        { value: 'procurement', label: 'Procurement' },
                        { value: 'compliance', label: 'Compliance' },
                    ].map((category) => (
                        <button
                            key={category.value}
                            onClick={() => setSelectedCategory(category.value)}
                            className={`px-4 py-2 rounded-lg transition-colors ${selectedCategory === category.value
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {category.label}
                        </button>
                    ))}
                </div>

                {/* Report Templates */}
                <section className="mb-12">
                    <h2 className="text-xl font-bold mb-4">Report Templates</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredTemplates.map((template) => (
                            <div
                                key={template.id}
                                className="bg-gray-800 border border-gray-700 rounded-xl p-6 hover:border-gray-600 transition-colors"
                            >
                                <div className="flex items-start gap-4 mb-4">
                                    <div
                                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${template.category === 'carbon'
                                                ? 'bg-emerald-900/50'
                                                : template.category === 'compliance'
                                                    ? 'bg-blue-900/50'
                                                    : 'bg-purple-900/50'
                                            }`}
                                    >
                                        <template.icon
                                            className={`w-6 h-6 ${template.category === 'carbon'
                                                    ? 'text-emerald-400'
                                                    : template.category === 'compliance'
                                                        ? 'text-blue-400'
                                                        : 'text-purple-400'
                                                }`}
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-bold mb-1">{template.name}</h3>
                                        <span className="text-xs text-gray-500 capitalize">{template.category}</span>
                                    </div>
                                </div>

                                <p className="text-sm text-gray-400 mb-4">{template.description}</p>

                                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                    <span>Formats: {template.formats.join(', ')}</span>
                                    <span>{template.estimatedTime}</span>
                                </div>

                                <button
                                    onClick={() => handleGenerateReport(template)}
                                    disabled={generating === template.id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                                >
                                    {generating === template.id ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                            Generate Report
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Reports */}
                <section>
                    <h2 className="text-xl font-bold mb-4">Recent Reports</h2>
                    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-700">
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Report</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Type</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Generated</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Size</th>
                                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-400">Status</th>
                                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-400">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {RECENT_REPORTS.map((report) => (
                                    <tr key={report.id} className="border-b border-gray-700 last:border-0">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <DocumentTextIcon className="w-5 h-5 text-gray-500" />
                                                <div>
                                                    <p className="font-medium">{report.name}</p>
                                                    <p className="text-xs text-gray-500">{report.format}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{report.type}</td>
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(report.generatedAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{report.size}</td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${report.status === 'ready'
                                                        ? 'bg-emerald-900/50 text-emerald-400'
                                                        : report.status === 'generating'
                                                            ? 'bg-yellow-900/50 text-yellow-400'
                                                            : 'bg-red-900/50 text-red-400'
                                                    }`}
                                            >
                                                {report.status === 'ready' ? (
                                                    <CheckCircleIcon className="w-3.5 h-3.5" />
                                                ) : (
                                                    <ClockIcon className="w-3.5 h-3.5" />
                                                )}
                                                {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium">
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Configuration Modal */}
            {showConfigModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold">Configure Report</h2>
                            <p className="text-gray-400 text-sm mt-1">{selectedTemplate.name}</p>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Date Range */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Date Range</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                    <select
                                        value={reportConfig.dateRange}
                                        onChange={(e) => setReportConfig({ ...reportConfig, dateRange: e.target.value })}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                    >
                                        <option value="last-month">Last Month</option>
                                        <option value="last-quarter">Last Quarter</option>
                                        <option value="last-year">Last Year</option>
                                        <option value="ytd">Year to Date</option>
                                        <option value="all-time">All Time</option>
                                    </select>
                                </div>
                            </div>

                            {/* Projects */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Projects</label>
                                <select
                                    value={reportConfig.projects}
                                    onChange={(e) => setReportConfig({ ...reportConfig, projects: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="all">All Projects</option>
                                    <option value="active">Active Projects Only</option>
                                    <option value="completed">Completed Projects Only</option>
                                </select>
                            </div>

                            {/* Format */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Format</label>
                                <div className="flex gap-2">
                                    {selectedTemplate.formats.map((format) => (
                                        <button
                                            key={format}
                                            onClick={() => setReportConfig({ ...reportConfig, format })}
                                            className={`flex-1 px-4 py-2 rounded-lg border transition-colors ${reportConfig.format === format
                                                    ? 'border-emerald-500 bg-emerald-900/20'
                                                    : 'border-gray-700 hover:border-gray-600'
                                                }`}
                                        >
                                            {format}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeCharts}
                                        onChange={(e) =>
                                            setReportConfig({ ...reportConfig, includeCharts: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm">Include charts and visualizations</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeRawData}
                                        onChange={(e) =>
                                            setReportConfig({ ...reportConfig, includeRawData: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm">Include raw data tables</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-700 flex gap-3">
                            <button
                                onClick={() => setShowConfigModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={startGeneration}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <DocumentArrowDownIcon className="w-5 h-5" />
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Reports;
