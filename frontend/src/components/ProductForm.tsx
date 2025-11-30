import { useState } from 'react';
// @ts-ignore: allow importing global CSS without type declarations
import '../glassmorphism.css';

interface Material {
    name: string;
    percentage?: number;
}

interface VerificationResult {
    material: string;
    found: boolean;
    confidence: number;
    certifications?: string[];
}

interface ProductFormProps {
    onSuccess?: (product: any) => void;
}

export default function ProductForm({ onSuccess }: ProductFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        materials: [] as Material[],
        epdUrl: '',
        fscCertNumber: '',
        recycledContent: '',
        gwpValue: '',
        unit: 'sqft',
        pricePerUnit: ''
    });

    const [materialInput, setMaterialInput] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'verifying' | 'success' | 'error'>('idle');
    const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
    const [error, setError] = useState('');

    const addMaterial = () => {
        if (materialInput.trim()) {
            setFormData({
                ...formData,
                materials: [...formData.materials, { name: materialInput.trim() }]
            });
            setMaterialInput('');
        }
    };

    const removeMaterial = (index: number) => {
        setFormData({
            ...formData,
            materials: formData.materials.filter((_, i) => i !== index)
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            setError('Product name is required');
            return;
        }

        setStatus('submitting');
        setError('');

        try {
            const token = localStorage.getItem('authToken');

            const response = await fetch('/api/v1/products', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...formData,
                    recycledContent: formData.recycledContent ? parseFloat(formData.recycledContent) : null,
                    gwpValue: formData.gwpValue ? parseFloat(formData.gwpValue) : null,
                    pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create product');
            }

            // Show verification phase
            setStatus('verifying');

            if (data.verification?.results) {
                setVerificationResults(data.verification.results);
            }

            // Brief delay to show verification results
            await new Promise(resolve => setTimeout(resolve, 1500));

            setStatus('success');
            onSuccess?.(data.product);

        } catch (err) {
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    const getVerificationBadge = (result: VerificationResult) => {
        if (result.found && result.confidence >= 80) {
            return (
                <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified ({result.confidence}%)
                </span>
            );
        } else if (result.found) {
            return (
                <span className="px-2 py-1 rounded-full text-xs bg-yellow-500/20 text-yellow-400">
                    Partial Match ({result.confidence}%)
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded-full text-xs bg-gray-500/20 text-gray-400">
                Not Found
            </span>
        );
    };

    if (status === 'success') {
        return (
            <div className="glass-card p-8 rounded-2xl text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Product Added!</h3>
                <p className="text-gray-300 mb-4">
                    Your product has been created and automatically verified against certification databases.
                </p>

                {verificationResults.length > 0 && (
                    <div className="mt-6 space-y-2">
                        <h4 className="text-sm font-medium text-gray-400">Verification Results:</h4>
                        {verificationResults.map((result, i) => (
                            <div key={i} className="flex items-center justify-between glass-card p-3 rounded-lg">
                                <span className="text-white">{result.material}</span>
                                {getVerificationBadge(result)}
                            </div>
                        ))}
                    </div>
                )}

                <button
                    onClick={() => {
                        setStatus('idle');
                        setFormData({
                            name: '', description: '', category: '', materials: [],
                            epdUrl: '', fscCertNumber: '', recycledContent: '',
                            gwpValue: '', unit: 'sqft', pricePerUnit: ''
                        });
                        setVerificationResults([]);
                    }}
                    className="glass-button mt-6 px-6 py-2 rounded-lg"
                >
                    Add Another Product
                </button>
            </div>
        );
    }

    if (status === 'verifying') {
        return (
            <div className="glass-card p-8 rounded-2xl text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center animate-pulse">
                    <svg className="w-10 h-10 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Verifying Materials...</h3>
                <p className="text-gray-300">
                    Cross-referencing with FSC, EPD International, and EC3 databases...
                </p>

                <div className="mt-6 space-y-2">
                    {formData.materials.map((m, i) => (
                        <div key={i} className="flex items-center gap-3 glass-card p-3 rounded-lg">
                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-white">{m.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-card p-6 rounded-2xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add New Product
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Product Name *</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Recycled Steel Beam"
                            className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            className="glass-input w-full px-4 py-3 rounded-xl text-white bg-transparent"
                        >
                            <option value="">Select category...</option>
                            <option value="structural">Structural</option>
                            <option value="insulation">Insulation</option>
                            <option value="flooring">Flooring</option>
                            <option value="roofing">Roofing</option>
                            <option value="finishes">Finishes</option>
                            <option value="glazing">Glazing</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm text-gray-300 mb-1">Description</label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe your product and its sustainability features..."
                        rows={3}
                        className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                    />
                </div>

                {/* Materials Section */}
                <div>
                    <label className="block text-sm text-gray-300 mb-1">
                        Materials (auto-verified against certification databases)
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={materialInput}
                            onChange={(e) => setMaterialInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                            placeholder="e.g., recycled steel, FSC wood, low-carbon concrete"
                            className="glass-input flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-400"
                        />
                        <button
                            type="button"
                            onClick={addMaterial}
                            className="glass-button px-4 py-3 rounded-xl"
                        >
                            Add
                        </button>
                    </div>

                    {formData.materials.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            {formData.materials.map((m, i) => (
                                <span
                                    key={i}
                                    className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm flex items-center gap-2"
                                >
                                    {m.name}
                                    <button
                                        type="button"
                                        onClick={() => removeMaterial(i)}
                                        className="text-emerald-400 hover:text-red-400"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Certifications */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">EPD URL</label>
                        <input
                            type="url"
                            value={formData.epdUrl}
                            onChange={(e) => setFormData({ ...formData, epdUrl: e.target.value })}
                            placeholder="https://..."
                            className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">FSC Certificate Number</label>
                        <input
                            type="text"
                            value={formData.fscCertNumber}
                            onChange={(e) => setFormData({ ...formData, fscCertNumber: e.target.value })}
                            placeholder="e.g., FSC-C123456"
                            className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Sustainability Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Recycled Content (%)</label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={formData.recycledContent}
                            onChange={(e) => setFormData({ ...formData, recycledContent: e.target.value })}
                            placeholder="0-100"
                            className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">GWP (kg CO₂e)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={formData.gwpValue}
                            onChange={(e) => setFormData({ ...formData, gwpValue: e.target.value })}
                            placeholder="e.g., 2.5"
                            className="glass-input w-full px-4 py-3 rounded-xl text-white placeholder-gray-400"
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-gray-300 mb-1">Price per Unit</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                step="0.01"
                                value={formData.pricePerUnit}
                                onChange={(e) => setFormData({ ...formData, pricePerUnit: e.target.value })}
                                placeholder="0.00"
                                className="glass-input flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-400"
                            />
                            <select
                                value={formData.unit}
                                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                className="glass-input px-3 py-3 rounded-xl text-white bg-transparent"
                            >
                                <option value="sqft">sqft</option>
                                <option value="sqm">sqm</option>
                                <option value="lb">lb</option>
                                <option value="kg">kg</option>
                                <option value="unit">unit</option>
                            </select>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="p-4 rounded-xl bg-red-500/20 text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={status === 'submitting'}
                        className="glass-button flex-1 py-3 rounded-xl font-semibold text-lg"
                    >
                        {status === 'submitting' ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Creating...
                            </span>
                        ) : (
                            'Add Product & Auto-Verify'
                        )}
                    </button>
                </div>

                <p className="text-xs text-gray-400 text-center">
                    Products are automatically verified against FSC, EPD International, and EC3 certification databases.
                </p>
            </form>
        </div>
    );
}
