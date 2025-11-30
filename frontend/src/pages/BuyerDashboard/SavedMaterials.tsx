/**
 * Saved Materials Page
 * 
 * Displays materials saved by the buyer, organized by project
 * with carbon footprint summaries
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    BookmarkIcon,
    TrashIcon,
    FolderIcon,
    ArrowTopRightOnSquareIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ChartBarIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

interface SavedMaterial {
    id: string;
    productId: string;
    name: string;
    supplier: string;
    supplierId: string;
    category: string;
    gwp: number;
    gwpUnit: string;
    price?: number;
    currency?: string;
    imageUrl?: string;
    certifications: string[];
    savedAt: string;
    projectId?: string;
    projectName?: string;
    notes?: string;
}

interface Project {
    id: string;
    name: string;
    materialCount: number;
    totalCarbon: number;
}

// Mock data - replace with API
const MOCK_SAVED: SavedMaterial[] = [
    {
        id: 'sm-1',
        productId: 'prod-1',
        name: 'EcoSteel Recycled Structural Steel',
        supplier: 'GreenSteel Inc.',
        supplierId: 'sup-1',
        category: 'Steel',
        gwp: 0.85,
        gwpUnit: 'kg CO2e/kg',
        price: 1250,
        currency: 'USD',
        certifications: ['EPD Verified', 'Recycled 95%'],
        savedAt: '2024-11-20T10:30:00Z',
        projectId: 'proj-1',
        projectName: 'Downtown Office Tower',
    },
    {
        id: 'sm-2',
        productId: 'prod-2',
        name: 'BioBoard CLT Panels',
        supplier: 'Nordic Timber Co.',
        supplierId: 'sup-2',
        category: 'Mass Timber',
        gwp: 0.42,
        gwpUnit: 'kg CO2e/kg',
        price: 890,
        currency: 'USD',
        certifications: ['FSC Certified', 'EPD International'],
        savedAt: '2024-11-18T14:20:00Z',
        projectId: 'proj-1',
        projectName: 'Downtown Office Tower',
    },
    {
        id: 'sm-3',
        productId: 'prod-3',
        name: 'Cellulose Insulation R-40',
        supplier: 'GreenFiber Solutions',
        supplierId: 'sup-3',
        category: 'Insulation',
        gwp: 0.28,
        gwpUnit: 'kg CO2e/kg',
        price: 45,
        currency: 'USD',
        certifications: ['Recycled Content', 'GREENGUARD Gold'],
        savedAt: '2024-11-15T09:45:00Z',
        projectId: 'proj-2',
        projectName: 'Eco Residence',
    },
    {
        id: 'sm-4',
        productId: 'prod-4',
        name: 'Low-Carbon Ready Mix 4000 PSI',
        supplier: 'CleanCrete LLC',
        supplierId: 'sup-4',
        category: 'Concrete',
        gwp: 220,
        gwpUnit: 'kg CO2e/m³',
        price: 145,
        currency: 'USD',
        certifications: ['EPD Verified', '30% SCM'],
        savedAt: '2024-11-12T16:00:00Z',
    },
];

const MOCK_PROJECTS: Project[] = [
    { id: 'proj-1', name: 'Downtown Office Tower', materialCount: 2, totalCarbon: 1.27 },
    { id: 'proj-2', name: 'Eco Residence', materialCount: 1, totalCarbon: 0.28 },
];

export default function SavedMaterials() {
    const [materials, setMaterials] = useState<SavedMaterial[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterProject, setFilterProject] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'date' | 'gwp' | 'name'>('date');

    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setMaterials(MOCK_SAVED);
            setProjects(MOCK_PROJECTS);
            setLoading(false);
        }, 500);
    }, []);

    const handleRemove = (id: string) => {
        setMaterials(prev => prev.filter(m => m.id !== id));
    };

    const handleMoveToProject = (materialId: string, projectId: string) => {
        setMaterials(prev =>
            prev.map(m =>
                m.id === materialId
                    ? {
                        ...m,
                        projectId,
                        projectName: projects.find(p => p.id === projectId)?.name || 'Unassigned',
                    }
                    : m
            )
        );
    };

    // Filter and sort
    const filteredMaterials = materials
        .filter(m => {
            if (searchQuery && !m.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                return false;
            }
            if (filterProject !== 'all') {
                if (filterProject === 'unassigned' && m.projectId) return false;
                if (filterProject !== 'unassigned' && m.projectId !== filterProject) return false;
            }
            if (filterCategory !== 'all' && m.category !== filterCategory) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'date') return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
            if (sortBy === 'gwp') return a.gwp - b.gwp;
            return a.name.localeCompare(b.name);
        });

    const categories = [...new Set(materials.map(m => m.category))];

    const totalCarbon = filteredMaterials.reduce((sum, m) => sum + m.gwp, 0);

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
                            <BookmarkSolidIcon className="w-8 h-8 text-primary" />
                            Saved Materials
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            {materials.length} materials saved • {totalCarbon.toFixed(2)} kg CO2e total
                        </p>
                    </div>

                    <div className="mt-4 md:mt-0 flex gap-3">
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <MagnifyingGlassIcon className="w-5 h-5" />
                            Find Materials
                        </Link>
                        <Link
                            to="/dashboard/buyer/projects"
                            className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                        >
                            <FolderIcon className="w-5 h-5" />
                            My Projects
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground">Total Saved</div>
                        <div className="text-2xl font-bold text-foreground">{materials.length}</div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground">In Projects</div>
                        <div className="text-2xl font-bold text-foreground">
                            {materials.filter(m => m.projectId).length}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground">Avg GWP</div>
                        <div className="text-2xl font-bold text-green-600">
                            {(totalCarbon / materials.length || 0).toFixed(2)}
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-4">
                        <div className="text-sm text-muted-foreground">EPD Verified</div>
                        <div className="text-2xl font-bold text-foreground">
                            {materials.filter(m => m.certifications.some(c => c.includes('EPD'))).length}
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border border-border rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search saved materials..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <select
                                value={filterProject}
                                onChange={e => setFilterProject(e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Projects</option>
                                <option value="unassigned">Unassigned</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>

                            <select
                                value={filterCategory}
                                onChange={e => setFilterCategory(e.target.value)}
                                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(c => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>

                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as 'date' | 'gwp' | 'name')}
                                className="px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="date">Sort: Recent</option>
                                <option value="gwp">Sort: Lowest GWP</option>
                                <option value="name">Sort: Name</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Materials List */}
                {filteredMaterials.length === 0 ? (
                    <div className="text-center py-16 bg-card border border-border rounded-xl">
                        <BookmarkIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">No saved materials</h3>
                        <p className="text-muted-foreground mb-6">
                            {searchQuery || filterProject !== 'all' || filterCategory !== 'all'
                                ? 'Try adjusting your filters'
                                : 'Start saving materials to compare and organize them'}
                        </p>
                        <Link
                            to="/search"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                            <MagnifyingGlassIcon className="w-5 h-5" />
                            Browse Materials
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredMaterials.map(material => (
                            <div
                                key={material.id}
                                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4">
                                    {/* Image */}
                                    <div className="w-full md:w-24 h-24 bg-muted rounded-lg flex items-center justify-center">
                                        {material.imageUrl ? (
                                            <img
                                                src={material.imageUrl}
                                                alt={material.name}
                                                className="w-full h-full object-cover rounded-lg"
                                            />
                                        ) : (
                                            <span className="text-3xl">🏗️</span>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <Link
                                                    to={`/product/${material.productId}`}
                                                    className="text-lg font-semibold text-foreground hover:text-primary transition-colors"
                                                >
                                                    {material.name}
                                                </Link>
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                                    <Link
                                                        to={`/supplier/${material.supplierId}`}
                                                        className="hover:text-primary"
                                                    >
                                                        {material.supplier}
                                                    </Link>
                                                    <span>•</span>
                                                    <span>{material.category}</span>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    {material.gwp} <span className="text-sm font-normal">{material.gwpUnit}</span>
                                                </div>
                                                {material.price && (
                                                    <div className="text-sm text-muted-foreground">
                                                        ${material.price.toLocaleString()} {material.currency}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Certifications */}
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {material.certifications.map(cert => (
                                                <span
                                                    key={cert}
                                                    className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full"
                                                >
                                                    {cert}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Project & Actions */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                                            <div className="flex items-center gap-4">
                                                {material.projectName ? (
                                                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <FolderIcon className="w-4 h-4" />
                                                        {material.projectName}
                                                    </span>
                                                ) : (
                                                    <select
                                                        onChange={e => handleMoveToProject(material.id, e.target.value)}
                                                        className="text-sm px-2 py-1 bg-background border border-border rounded"
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Add to project...</option>
                                                        {projects.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name}</option>
                                                        ))}
                                                    </select>
                                                )}
                                                <span className="text-xs text-muted-foreground">
                                                    Saved {new Date(material.savedAt).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    to={`/product/${material.productId}`}
                                                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <ArrowTopRightOnSquareIcon className="w-5 h-5 text-muted-foreground" />
                                                </Link>
                                                <button
                                                    onClick={() => handleRemove(material.id)}
                                                    className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                                                    title="Remove from Saved"
                                                >
                                                    <TrashIcon className="w-5 h-5 text-muted-foreground group-hover:text-red-500" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Carbon Summary Footer */}
                {filteredMaterials.length > 0 && (
                    <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <ChartBarIcon className="w-10 h-10 text-green-600" />
                                <div>
                                    <h3 className="font-semibold text-foreground">Carbon Footprint Summary</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Based on {filteredMaterials.length} selected materials
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-3xl font-bold text-green-600">
                                    {totalCarbon.toFixed(2)}
                                </div>
                                <div className="text-sm text-muted-foreground">kg CO2e total GWP</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
