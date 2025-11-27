/**
 * Product Comparison Page
 * 
 * Side-by-side comparison of materials with carbon footprint,
 * certifications, pricing, and specifications
 */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    ArrowLeftIcon,
    XMarkIcon,
    PlusIcon,
    CheckIcon,
    XCircleIcon,
    ArrowTrendingDownIcon,
    DocumentArrowDownIcon,
    ShareIcon,
} from '@heroicons/react/24/outline';

interface CompareProduct {
    id: string;
    name: string;
    supplier: string;
    supplierId: string;
    category: string;
    imageUrl?: string;
    gwp: number;
    gwpUnit: string;
    price?: number;
    currency?: string;
    priceUnit?: string;
    certifications: string[];
    specs: Record<string, string | number>;
    leadTime?: string;
    moq?: number;
    region?: string;
    recycledContent?: number;
    epdVerified: boolean;
    epdId?: string;
}

// Mock data - replace with API
const MOCK_PRODUCTS: CompareProduct[] = [
    {
        id: 'prod-1',
        name: 'EcoSteel Recycled Structural Steel',
        supplier: 'GreenSteel Inc.',
        supplierId: 'sup-1',
        category: 'Steel',
        gwp: 0.85,
        gwpUnit: 'kg CO2e/kg',
        price: 1250,
        currency: 'USD',
        priceUnit: 'per ton',
        certifications: ['EPD Verified', 'ISO 14001', 'Recycled 95%'],
        specs: {
            'Yield Strength': '345 MPa',
            'Tensile Strength': '450 MPa',
            'Elongation': '22%',
            'Carbon Content': '0.20%',
        },
        leadTime: '2-3 weeks',
        moq: 10,
        region: 'North America',
        recycledContent: 95,
        epdVerified: true,
        epdId: 'S-P-01234',
    },
    {
        id: 'prod-2',
        name: 'Standard Structural Steel A992',
        supplier: 'MetalWorks Corp.',
        supplierId: 'sup-2',
        category: 'Steel',
        gwp: 2.1,
        gwpUnit: 'kg CO2e/kg',
        price: 980,
        currency: 'USD',
        priceUnit: 'per ton',
        certifications: ['ASTM A992', 'Mill Cert'],
        specs: {
            'Yield Strength': '345 MPa',
            'Tensile Strength': '450 MPa',
            'Elongation': '21%',
            'Carbon Content': '0.23%',
        },
        leadTime: '1-2 weeks',
        moq: 5,
        region: 'North America',
        recycledContent: 25,
        epdVerified: false,
    },
    {
        id: 'prod-3',
        name: 'Green Steel H2-DRI',
        supplier: 'Nordic Green Steel',
        supplierId: 'sup-3',
        category: 'Steel',
        gwp: 0.4,
        gwpUnit: 'kg CO2e/kg',
        price: 1650,
        currency: 'USD',
        priceUnit: 'per ton',
        certifications: ['EPD Verified', 'ISO 14001', 'ResponsibleSteel', 'Green Steel Certified'],
        specs: {
            'Yield Strength': '355 MPa',
            'Tensile Strength': '470 MPa',
            'Elongation': '22%',
            'Carbon Content': '0.18%',
        },
        leadTime: '4-6 weeks',
        moq: 25,
        region: 'Europe',
        recycledContent: 0,
        epdVerified: true,
        epdId: 'S-P-05678',
    },
];

export default function ProductComparison() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [products, setProducts] = useState<CompareProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Get product IDs from URL
    const productIds = searchParams.get('ids')?.split(',') || [];

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));

            // Filter mock products by IDs (or show all if no IDs)
            const filtered = productIds.length > 0
                ? MOCK_PRODUCTS.filter(p => productIds.includes(p.id))
                : MOCK_PRODUCTS.slice(0, 3);

            setProducts(filtered);
            setLoading(false);
        };

        fetchProducts();
    }, [searchParams]);

    const removeProduct = (id: string) => {
        const newIds = productIds.filter(pid => pid !== id);
        setSearchParams({ ids: newIds.join(',') });
    };

    const addProduct = (id: string) => {
        if (!productIds.includes(id) && products.length < 4) {
            const newIds = [...productIds, id];
            setSearchParams({ ids: newIds.join(',') });
        }
        setShowAddModal(false);
    };

    // Find the best (lowest) GWP for highlighting
    const lowestGwp = Math.min(...products.map(p => p.gwp));
    const lowestPrice = Math.min(...products.filter(p => p.price).map(p => p.price!));

    // Get all unique specs across products
    const allSpecs = [...new Set(products.flatMap(p => Object.keys(p.specs)))];

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
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/search"
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <ArrowLeftIcon className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Compare Products</h1>
                            <p className="text-muted-foreground">
                                {products.length} products selected
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                            <ShareIcon className="w-5 h-5" />
                            Share
                        </button>
                        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                            <DocumentArrowDownIcon className="w-5 h-5" />
                            Export PDF
                        </button>
                    </div>
                </div>

                {products.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-xl">
                        <h3 className="text-xl font-semibold text-foreground mb-2">No products to compare</h3>
                        <p className="text-muted-foreground mb-6">
                            Add products from search or your saved materials
                        </p>
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            Browse Products
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            {/* Product Headers */}
                            <thead>
                                <tr>
                                    <th className="w-48 p-4 text-left font-medium text-muted-foreground sticky left-0 bg-background"></th>
                                    {products.map(product => (
                                        <th key={product.id} className="min-w-64 p-4">
                                            <div className="bg-card border border-border rounded-xl p-4 relative">
                                                <button
                                                    onClick={() => removeProduct(product.id)}
                                                    className="absolute top-2 right-2 p-1 hover:bg-muted rounded-full"
                                                >
                                                    <XMarkIcon className="w-4 h-4 text-muted-foreground" />
                                                </button>

                                                {/* Product Image */}
                                                <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-4">
                                                    {product.imageUrl ? (
                                                        <img src={product.imageUrl} alt={product.name} className="h-full object-contain" />
                                                    ) : (
                                                        <span className="text-4xl">🏗️</span>
                                                    )}
                                                </div>

                                                <Link
                                                    to={`/product/${product.id}`}
                                                    className="font-semibold text-foreground hover:text-primary block text-center"
                                                >
                                                    {product.name}
                                                </Link>
                                                <Link
                                                    to={`/supplier/${product.supplierId}`}
                                                    className="text-sm text-muted-foreground hover:text-primary block text-center mt-1"
                                                >
                                                    {product.supplier}
                                                </Link>
                                            </div>
                                        </th>
                                    ))}
                                    {products.length < 4 && (
                                        <th className="min-w-64 p-4">
                                            <button
                                                onClick={() => setShowAddModal(true)}
                                                className="w-full h-64 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2"
                                            >
                                                <PlusIcon className="w-8 h-8 text-muted-foreground" />
                                                <span className="text-muted-foreground">Add Product</span>
                                            </button>
                                        </th>
                                    )}
                                </tr>
                            </thead>

                            <tbody>
                                {/* Carbon Footprint Row - Highlighted */}
                                <tr className="bg-green-50/50">
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-green-50/50">
                                        <div className="flex items-center gap-2">
                                            <ArrowTrendingDownIcon className="w-5 h-5 text-green-600" />
                                            Carbon Footprint (GWP)
                                        </div>
                                    </td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            <div className={`text-2xl font-bold ${product.gwp === lowestGwp ? 'text-green-600' : 'text-foreground'}`}>
                                                {product.gwp}
                                            </div>
                                            <div className="text-sm text-muted-foreground">{product.gwpUnit}</div>
                                            {product.gwp === lowestGwp && (
                                                <span className="inline-flex items-center gap-1 mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                                    <CheckIcon className="w-3 h-3" />
                                                    Lowest GWP
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Price Row */}
                                <tr>
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-background">Price</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.price ? (
                                                <>
                                                    <div className={`text-xl font-bold ${product.price === lowestPrice ? 'text-green-600' : 'text-foreground'}`}>
                                                        ${product.price.toLocaleString()}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">{product.priceUnit}</div>
                                                    {product.price === lowestPrice && (
                                                        <span className="inline-flex items-center gap-1 mt-1 text-xs text-green-600">
                                                            Best Price
                                                        </span>
                                                    )}
                                                </>
                                            ) : (
                                                <span className="text-muted-foreground">Contact for quote</span>
                                            )}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* EPD Verified Row */}
                                <tr className="bg-muted/30">
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-muted/30">EPD Verified</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.epdVerified ? (
                                                <div className="flex flex-col items-center">
                                                    <CheckIcon className="w-6 h-6 text-green-600" />
                                                    {product.epdId && (
                                                        <span className="text-xs text-muted-foreground mt-1">{product.epdId}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <XCircleIcon className="w-6 h-6 text-muted-foreground mx-auto" />
                                            )}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Recycled Content Row */}
                                <tr>
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-background">Recycled Content</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.recycledContent !== undefined ? (
                                                <div className="flex flex-col items-center">
                                                    <div className="w-16 h-16 relative">
                                                        <svg className="w-16 h-16 transform -rotate-90">
                                                            <circle
                                                                cx="32"
                                                                cy="32"
                                                                r="28"
                                                                stroke="currentColor"
                                                                strokeWidth="8"
                                                                fill="none"
                                                                className="text-muted"
                                                            />
                                                            <circle
                                                                cx="32"
                                                                cy="32"
                                                                r="28"
                                                                stroke="currentColor"
                                                                strokeWidth="8"
                                                                fill="none"
                                                                strokeDasharray={`${(product.recycledContent / 100) * 176} 176`}
                                                                className="text-green-500"
                                                            />
                                                        </svg>
                                                        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                                                            {product.recycledContent}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Certifications Row */}
                                <tr className="bg-muted/30">
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-muted/30">Certifications</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4">
                                            <div className="flex flex-wrap gap-1 justify-center">
                                                {product.certifications.map(cert => (
                                                    <span
                                                        key={cert}
                                                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                                    >
                                                        {cert}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Lead Time Row */}
                                <tr>
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-background">Lead Time</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.leadTime || '—'}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* MOQ Row */}
                                <tr className="bg-muted/30">
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-muted/30">Min Order Qty</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.moq ? `${product.moq} tons` : '—'}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Region Row */}
                                <tr>
                                    <td className="p-4 font-medium text-foreground sticky left-0 bg-background">Region</td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            {product.region || '—'}
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>

                                {/* Specs Section Header */}
                                <tr>
                                    <td colSpan={products.length + 2} className="p-4 pt-8">
                                        <h3 className="font-semibold text-foreground">Technical Specifications</h3>
                                    </td>
                                </tr>

                                {/* Dynamic Spec Rows */}
                                {allSpecs.map((spec, index) => (
                                    <tr key={spec} className={index % 2 === 0 ? 'bg-muted/30' : ''}>
                                        <td className={`p-4 font-medium text-foreground sticky left-0 ${index % 2 === 0 ? 'bg-muted/30' : 'bg-background'}`}>
                                            {spec}
                                        </td>
                                        {products.map(product => (
                                            <td key={product.id} className="p-4 text-center">
                                                {product.specs[spec] || '—'}
                                            </td>
                                        ))}
                                        {products.length < 4 && <td></td>}
                                    </tr>
                                ))}

                                {/* Action Row */}
                                <tr>
                                    <td className="p-4 sticky left-0 bg-background"></td>
                                    {products.map(product => (
                                        <td key={product.id} className="p-4 text-center">
                                            <div className="flex flex-col gap-2">
                                                <Link
                                                    to={`/product/${product.id}`}
                                                    className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-center"
                                                >
                                                    View Details
                                                </Link>
                                                <button className="w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors">
                                                    Request Quote
                                                </button>
                                            </div>
                                        </td>
                                    ))}
                                    {products.length < 4 && <td></td>}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Summary Box */}
                {products.length > 0 && (
                    <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Comparison Summary</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Lowest Carbon Option</div>
                                <div className="font-medium text-foreground">
                                    {products.find(p => p.gwp === lowestGwp)?.name}
                                </div>
                                <div className="text-green-600 text-sm">
                                    {lowestGwp} {products[0]?.gwpUnit}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Carbon Savings Potential</div>
                                <div className="font-medium text-foreground">
                                    {Math.round(((Math.max(...products.map(p => p.gwp)) - lowestGwp) / Math.max(...products.map(p => p.gwp))) * 100)}%
                                </div>
                                <div className="text-sm text-muted-foreground">vs highest carbon option</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground mb-1">Most Certified</div>
                                <div className="font-medium text-foreground">
                                    {products.reduce((prev, curr) =>
                                        prev.certifications.length > curr.certifications.length ? prev : curr
                                    ).name}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {Math.max(...products.map(p => p.certifications.length))} certifications
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Product Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-foreground">Add Product to Compare</h3>
                            <button onClick={() => setShowAddModal(false)}>
                                <XMarkIcon className="w-6 h-6 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-y-auto">
                            {MOCK_PRODUCTS.filter(p => !productIds.includes(p.id)).map(product => (
                                <button
                                    key={product.id}
                                    onClick={() => addProduct(product.id)}
                                    className="w-full flex items-center gap-4 p-3 hover:bg-muted rounded-lg transition-colors text-left"
                                >
                                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                        🏗️
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-medium text-foreground">{product.name}</div>
                                        <div className="text-sm text-muted-foreground">{product.supplier}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-medium text-green-600">{product.gwp}</div>
                                        <div className="text-xs text-muted-foreground">{product.gwpUnit}</div>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="mt-4 pt-4 border-t border-border">
                            <Link
                                to="/search"
                                onClick={() => setShowAddModal(false)}
                                className="text-primary hover:underline text-sm"
                            >
                                Search for more products →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
