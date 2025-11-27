import { useState } from 'react';
import {
    Leaf,
    Calculator,
    Plus,
    Trash2,
    BarChart3,
    TrendingDown,
    FileText,
    RefreshCw,
    Lightbulb,
    Target,
    TreePine,
    Wind,
} from 'lucide-react';

interface Material {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    gwp: number;
    category: string;
}

interface AnalysisResult {
    projectId: string;
    totalCarbon: number;
    carbonPerSqFt: number;
    breakdown: {
        stage: string;
        value: number;
        percentage: number;
    }[];
    materialBreakdown: {
        name: string;
        carbon: number;
        percentage: number;
        quantity: number;
        unit: string;
    }[];
    benchmark: {
        industry: number;
        difference: number;
        percentageVsIndustry: number;
        rating: string;
    };
    recommendations: {
        priority: string;
        action: string;
        potentialSavings: number;
        estimatedCost: string;
        roi: string;
    }[];
    alternatives: {
        original: string;
        alternative: string;
        savingsPerUnit: number;
        percentageReduction: number;
    }[];
}

const commonMaterials = [
    { name: 'Concrete (Standard)', gwp: 0.13, unit: 'kg', category: 'Structural' },
    { name: 'Concrete (Low-Carbon)', gwp: 0.08, unit: 'kg', category: 'Structural' },
    { name: 'Steel (Virgin)', gwp: 2.8, unit: 'kg', category: 'Structural' },
    { name: 'Steel (Recycled)', gwp: 0.5, unit: 'kg', category: 'Structural' },
    { name: 'Aluminum', gwp: 8.14, unit: 'kg', category: 'Metals' },
    { name: 'Timber (CLT)', gwp: -0.7, unit: 'kg', category: 'Wood' },
    { name: 'Timber (Glulam)', gwp: -0.5, unit: 'kg', category: 'Wood' },
    { name: 'Glass', gwp: 1.5, unit: 'kg', category: 'Envelope' },
    { name: 'Insulation (Mineral Wool)', gwp: 1.2, unit: 'kg', category: 'Envelope' },
    { name: 'Insulation (XPS)', gwp: 3.4, unit: 'kg', category: 'Envelope' },
    { name: 'Brick', gwp: 0.24, unit: 'kg', category: 'Masonry' },
    { name: 'Gypsum Board', gwp: 0.39, unit: 'kg', category: 'Interior' },
];

const buildingTypes = [
    'Office',
    'Residential',
    'Industrial',
    'Retail',
    'Healthcare',
    'Education',
    'Warehouse',
    'Mixed-Use',
];

export default function CarbonCalculator() {
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [buildingType, setBuildingType] = useState('');
    const [squareFootage, setSquareFootage] = useState<number>(0);
    const [location, setLocation] = useState({ city: '', state: '', country: '' });
    const [materials, setMaterials] = useState<Material[]>([]);
    const [selectedMaterial, setSelectedMaterial] = useState('');
    const [quantity, setQuantity] = useState<number>(0);
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');

    const addMaterial = () => {
        const materialData = commonMaterials.find((m) => m.name === selectedMaterial);
        if (materialData && quantity > 0) {
            const newMaterial: Material = {
                id: `mat-${Date.now()}`,
                name: materialData.name,
                quantity,
                unit: materialData.unit,
                gwp: materialData.gwp,
                category: materialData.category,
            };
            setMaterials([...materials, newMaterial]);
            setSelectedMaterial('');
            setQuantity(0);
        }
    };

    const removeMaterial = (id: string) => {
        setMaterials(materials.filter((m) => m.id !== id));
    };

    const calculateQuickEstimate = () => {
        return materials.reduce((total, mat) => total + mat.quantity * mat.gwp, 0);
    };

    const analyzeProject = async () => {
        if (materials.length === 0) {
            alert('Please add at least one material');
            return;
        }

        setIsAnalyzing(true);
        try {
            const response = await fetch('/api/carbon/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: projectName,
                    description: projectDescription,
                    buildingType,
                    squareFootage,
                    location,
                    materials: materials.map((m) => ({
                        name: m.name,
                        gwp: m.gwp,
                        unit: m.unit,
                        quantity: m.quantity,
                    })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAnalysisResult(data);
                setActiveTab('results');
            } else {
                // Fallback to local calculation
                const totalCarbon = calculateQuickEstimate();
                const mockResult: AnalysisResult = {
                    projectId: `proj-${Date.now()}`,
                    totalCarbon,
                    carbonPerSqFt: squareFootage > 0 ? totalCarbon / squareFootage : 0,
                    breakdown: [
                        { stage: 'A1 - Raw Materials', value: totalCarbon * 0.35, percentage: 35 },
                        { stage: 'A2 - Transport to Factory', value: totalCarbon * 0.1, percentage: 10 },
                        { stage: 'A3 - Manufacturing', value: totalCarbon * 0.25, percentage: 25 },
                        { stage: 'A4 - Transport to Site', value: totalCarbon * 0.15, percentage: 15 },
                        { stage: 'A5 - Construction', value: totalCarbon * 0.15, percentage: 15 },
                    ],
                    materialBreakdown: materials.map((m) => ({
                        name: m.name,
                        carbon: m.quantity * m.gwp,
                        percentage: (m.quantity * m.gwp / totalCarbon) * 100,
                        quantity: m.quantity,
                        unit: m.unit,
                    })),
                    benchmark: {
                        industry: 50, // kg CO2e/sqft average
                        difference: squareFootage > 0 ? (totalCarbon / squareFootage) - 50 : 0,
                        percentageVsIndustry: squareFootage > 0 ? (((totalCarbon / squareFootage) / 50) - 1) * 100 : 0,
                        rating: squareFootage > 0 && (totalCarbon / squareFootage) < 40 ? 'Excellent' :
                            squareFootage > 0 && (totalCarbon / squareFootage) < 50 ? 'Good' :
                                squareFootage > 0 && (totalCarbon / squareFootage) < 60 ? 'Average' : 'Needs Improvement',
                    },
                    recommendations: [
                        {
                            priority: 'High',
                            action: 'Switch to low-carbon concrete',
                            potentialSavings: totalCarbon * 0.15,
                            estimatedCost: 'Low',
                            roi: '12 months',
                        },
                        {
                            priority: 'Medium',
                            action: 'Use recycled steel instead of virgin steel',
                            potentialSavings: totalCarbon * 0.1,
                            estimatedCost: 'Medium',
                            roi: '18 months',
                        },
                        {
                            priority: 'Low',
                            action: 'Consider timber alternatives',
                            potentialSavings: totalCarbon * 0.08,
                            estimatedCost: 'Variable',
                            roi: '24 months',
                        },
                    ],
                    alternatives: [
                        {
                            original: 'Concrete (Standard)',
                            alternative: 'Concrete (Low-Carbon)',
                            savingsPerUnit: 0.05,
                            percentageReduction: 38,
                        },
                        {
                            original: 'Steel (Virgin)',
                            alternative: 'Steel (Recycled)',
                            savingsPerUnit: 2.3,
                            percentageReduction: 82,
                        },
                    ],
                };
                setAnalysisResult(mockResult);
                setActiveTab('results');
            }
        } catch (error) {
            console.error('Analysis failed:', error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatCarbon = (value: number) => {
        if (Math.abs(value) >= 1000000) {
            return `${(value / 1000000).toFixed(2)} t CO₂e`;
        } else if (Math.abs(value) >= 1000) {
            return `${(value / 1000).toFixed(2)} t CO₂e`;
        }
        return `${value.toFixed(2)} kg CO₂e`;
    };

    const getRatingColor = (rating: string) => {
        switch (rating) {
            case 'Excellent': return 'text-green-600 bg-green-100';
            case 'Good': return 'text-blue-600 bg-blue-100';
            case 'Average': return 'text-yellow-600 bg-yellow-100';
            default: return 'text-red-600 bg-red-100';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-lg p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <Calculator className="w-8 h-8" />
                    <h1 className="text-2xl font-bold">Carbon Calculator</h1>
                </div>
                <p className="text-green-100">
                    Analyze and optimize the carbon footprint of your construction projects
                </p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('input')}
                    className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'input'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                >
                    Project Input
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    disabled={!analysisResult}
                    className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'results'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50'
                        }`}
                >
                    Analysis Results
                </button>
            </div>

            {activeTab === 'input' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Project Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-green-600" />
                                Project Details
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Project Name
                                    </label>
                                    <input
                                        type="text"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="e.g., Green Office Tower"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Building Type
                                    </label>
                                    <select
                                        value={buildingType}
                                        onChange={(e) => setBuildingType(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Select type...</option>
                                        {buildingTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Square Footage
                                    </label>
                                    <input
                                        type="number"
                                        value={squareFootage || ''}
                                        onChange={(e) => setSquareFootage(Number(e.target.value))}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="Total sq ft"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location (City)
                                    </label>
                                    <input
                                        type="text"
                                        value={location.city}
                                        onChange={(e) => setLocation({ ...location, city: e.target.value })}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        placeholder="City"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description
                                    </label>
                                    <textarea
                                        value={projectDescription}
                                        onChange={(e) => setProjectDescription(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                        rows={2}
                                        placeholder="Brief project description..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Materials Input */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Leaf className="w-5 h-5 text-green-600" />
                                Materials
                            </h2>

                            <div className="flex gap-2 mb-4">
                                <select
                                    value={selectedMaterial}
                                    onChange={(e) => setSelectedMaterial(e.target.value)}
                                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                                >
                                    <option value="">Select material...</option>
                                    {commonMaterials.map((mat) => (
                                        <option key={mat.name} value={mat.name}>
                                            {mat.name} ({mat.gwp > 0 ? '+' : ''}{mat.gwp} kg CO₂e/{mat.unit})
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    value={quantity || ''}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                                    placeholder="Qty (kg)"
                                />
                                <button
                                    onClick={addMaterial}
                                    disabled={!selectedMaterial || quantity <= 0}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {materials.length > 0 ? (
                                <div className="space-y-2">
                                    {materials.map((mat) => (
                                        <div
                                            key={mat.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <div className="flex-1">
                                                <span className="font-medium">{mat.name}</span>
                                                <span className="text-gray-500 ml-2">
                                                    {mat.quantity.toLocaleString()} {mat.unit}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={`font-medium ${mat.gwp < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                                                    {formatCarbon(mat.quantity * mat.gwp)}
                                                </span>
                                                <button
                                                    onClick={() => removeMaterial(mat.id)}
                                                    className="text-red-500 hover:text-red-700"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <Leaf className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>Add materials to calculate carbon footprint</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quick Summary */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-lg shadow p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                                Quick Estimate
                            </h2>

                            <div className="text-center py-6">
                                <div className="text-4xl font-bold text-gray-800 mb-2">
                                    {formatCarbon(calculateQuickEstimate())}
                                </div>
                                <div className="text-gray-500">Total Embodied Carbon</div>
                                {squareFootage > 0 && (
                                    <div className="mt-2 text-sm text-gray-600">
                                        {(calculateQuickEstimate() / squareFootage).toFixed(2)} kg CO₂e/sq ft
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Materials Added</span>
                                    <span className="font-medium">{materials.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Carbon Negative Materials</span>
                                    <span className="font-medium text-green-600">
                                        {materials.filter((m) => m.gwp < 0).length}
                                    </span>
                                </div>
                            </div>

                            <button
                                onClick={analyzeProject}
                                disabled={materials.length === 0 || isAnalyzing}
                                className="w-full mt-6 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 animate-spin" />
                                        Analyzing...
                                    </>
                                ) : (
                                    <>
                                        <Calculator className="w-5 h-5" />
                                        Run Full Analysis
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Tips Card */}
                        <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                            <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
                                <Lightbulb className="w-5 h-5" />
                                Carbon Tips
                            </h3>
                            <ul className="space-y-2 text-sm text-green-700">
                                <li className="flex items-start gap-2">
                                    <TreePine className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Timber products store carbon, showing negative GWP values</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Wind className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Recycled steel can reduce embodied carbon by up to 80%</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Target className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                    <span>Low-carbon concrete reduces emissions by 30-40%</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'results' && analysisResult && (
                <div className="space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500 mb-1">Total Carbon</div>
                            <div className="text-2xl font-bold text-gray-800">
                                {formatCarbon(analysisResult.totalCarbon)}
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500 mb-1">Per Square Foot</div>
                            <div className="text-2xl font-bold text-gray-800">
                                {analysisResult.carbonPerSqFt.toFixed(2)} kg
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500 mb-1">vs Industry Avg</div>
                            <div className={`text-2xl font-bold ${analysisResult.benchmark.percentageVsIndustry < 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                {analysisResult.benchmark.percentageVsIndustry > 0 ? '+' : ''}
                                {analysisResult.benchmark.percentageVsIndustry.toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="text-sm text-gray-500 mb-1">Rating</div>
                            <div className={`text-lg font-bold px-3 py-1 rounded-full inline-block ${getRatingColor(analysisResult.benchmark.rating)
                                }`}>
                                {analysisResult.benchmark.rating}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Lifecycle Breakdown */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-green-600" />
                                Lifecycle Stages (A1-A5)
                            </h3>
                            <div className="space-y-3">
                                {analysisResult.breakdown.map((stage) => (
                                    <div key={stage.stage}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600">{stage.stage}</span>
                                            <span className="font-medium">{stage.percentage.toFixed(0)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-green-600 h-2 rounded-full"
                                                style={{ width: `${stage.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Material Breakdown */}
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Leaf className="w-5 h-5 text-green-600" />
                                Material Contribution
                            </h3>
                            <div className="space-y-3">
                                {analysisResult.materialBreakdown
                                    .sort((a, b) => b.carbon - a.carbon)
                                    .slice(0, 6)
                                    .map((mat) => (
                                        <div key={mat.name}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">{mat.name}</span>
                                                <span className="font-medium">{formatCarbon(mat.carbon)}</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full ${mat.carbon < 0 ? 'bg-emerald-500' : 'bg-blue-600'}`}
                                                    style={{ width: `${Math.min(Math.abs(mat.percentage), 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingDown className="w-5 h-5 text-green-600" />
                            Carbon Reduction Recommendations
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-sm text-gray-500 border-b">
                                        <th className="pb-2">Priority</th>
                                        <th className="pb-2">Action</th>
                                        <th className="pb-2">Potential Savings</th>
                                        <th className="pb-2">Est. Cost</th>
                                        <th className="pb-2">ROI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysisResult.recommendations.map((rec, index) => (
                                        <tr key={index} className="border-b last:border-0">
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                                                        rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {rec.priority}
                                                </span>
                                            </td>
                                            <td className="py-3 font-medium">{rec.action}</td>
                                            <td className="py-3 text-green-600 font-medium">
                                                -{formatCarbon(rec.potentialSavings)}
                                            </td>
                                            <td className="py-3 text-gray-600">{rec.estimatedCost}</td>
                                            <td className="py-3 text-gray-600">{rec.roi}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Alternatives */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 text-green-600" />
                            Sustainable Alternatives
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {analysisResult.alternatives.map((alt, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-gray-500 line-through">{alt.original}</span>
                                        <span className="text-gray-400">→</span>
                                        <span className="font-medium text-green-700">{alt.alternative}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Savings per unit</span>
                                        <span className="text-green-600 font-medium">
                                            -{alt.savingsPerUnit.toFixed(2)} kg CO₂e
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500">Reduction</span>
                                        <span className="text-green-600 font-medium">
                                            {alt.percentageReduction}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab('input')}
                            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                            Modify Inputs
                        </button>
                        <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            Export Report
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
