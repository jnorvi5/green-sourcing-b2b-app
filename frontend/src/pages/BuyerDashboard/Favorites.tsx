/**
 * Favorites/Wishlist Page
 *
 * Allows buyers to save and organize favorite materials
 * for easy access and comparison
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    HeartIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    Squares2X2Icon,
    ListBulletIcon,
    TrashIcon,
    ArrowsRightLeftIcon,
    ShoppingCartIcon,
    FolderIcon,
    PlusIcon,
    XMarkIcon,
    GlobeAltIcon,
    BuildingOffice2Icon,
    CheckBadgeIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';

interface FavoriteItem {
    id: string;
    productId: string;
    productName: string;
    supplier: {
        id: string;
        name: string;
    };
    category: string;
    price: number;
    unit: string;
    carbonFootprint: number;
    image?: string;
    certifications: string[];
    addedAt: string;
    collection?: string;
    notes?: string;
}

interface Collection {
    id: string;
    name: string;
    count: number;
    color: string;
}

const MOCK_FAVORITES: FavoriteItem[] = [
    {
        id: 'f1',
        productId: 'p1',
        productName: 'Recycled Structural Steel Beams',
        supplier: { id: 's1', name: 'EcoSteel Solutions' },
        category: 'Structural Steel',
        price: 1850,
        unit: 'ton',
        carbonFootprint: 850,
        certifications: ['EPD Verified', 'ISO 14001'],
        addedAt: '2024-01-20',
        collection: 'Portland Project',
    },
    {
        id: 'f2',
        productId: 'p2',
        productName: 'Low-Carbon Concrete Mix Type A',
        supplier: { id: 's2', name: 'GreenConcrete Inc' },
        category: 'Concrete',
        price: 185,
        unit: 'cubic yard',
        carbonFootprint: 180,
        certifications: ['EPD Verified', 'LEED Compliant'],
        addedAt: '2024-01-18',
        collection: 'Seattle Tower',
        notes: 'Best option for foundation work',
    },
    {
        id: 'f3',
        productId: 'p3',
        productName: 'FSC Certified CLT Panels',
        supplier: { id: 's3', name: 'TimberTech FSC' },
        category: 'Timber',
        price: 2450,
        unit: 'panel',
        carbonFootprint: -120,
        certifications: ['FSC Certified', 'EPD Verified', 'Carbon Negative'],
        addedAt: '2024-01-15',
        collection: 'Portland Project',
    },
    {
        id: 'f4',
        productId: 'p4',
        productName: 'Mineral Wool Insulation R-30',
        supplier: { id: 's4', name: 'InsulPro Materials' },
        category: 'Insulation',
        price: 4.5,
        unit: 'sq ft',
        carbonFootprint: 2.1,
        certifications: ['GreenGuard Gold'],
        addedAt: '2024-01-10',
    },
    {
        id: 'f5',
        productId: 'p5',
        productName: 'Recycled Aluminum Window Frames',
        supplier: { id: 's5', name: 'AlumaTech Green' },
        category: 'Aluminum',
        price: 89,
        unit: 'linear ft',
        carbonFootprint: 4.2,
        certifications: ['Cradle to Cradle'],
        addedAt: '2024-01-05',
        collection: 'Seattle Tower',
    },
    {
        id: 'f6',
        productId: 'p6',
        productName: 'Geopolymer Concrete Blocks',
        supplier: { id: 's6', name: 'GeoCrete Systems' },
        category: 'Concrete',
        price: 12,
        unit: 'block',
        carbonFootprint: 1.8,
        certifications: ['EPD Verified'],
        addedAt: '2024-01-02',
    },
];

const MOCK_COLLECTIONS: Collection[] = [
    { id: 'c1', name: 'Portland Project', count: 2, color: 'bg-emerald-500' },
    { id: 'c2', name: 'Seattle Tower', count: 2, color: 'bg-blue-500' },
    { id: 'c3', name: 'Budget Options', count: 0, color: 'bg-yellow-500' },
];

export default function Favorites() {
    const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showNewCollection, setShowNewCollection] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await new Promise((resolve) => setTimeout(resolve, 300));
            setFavorites(MOCK_FAVORITES);
            setCollections(MOCK_COLLECTIONS);
            setLoading(false);
        };
        fetchData();
    }, []);

    const filteredFavorites = favorites.filter((fav) => {
        const matchesSearch =
            fav.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fav.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            fav.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCollection = !selectedCollection || fav.collection === selectedCollection;
        return matchesSearch && matchesCollection;
    });

    const handleRemoveFavorite = (id: string) => {
        setFavorites((prev) => prev.filter((f) => f.id !== id));
        setSelectedItems((prev) => prev.filter((i) => i !== id));
    };

    const handleRemoveSelected = () => {
        setFavorites((prev) => prev.filter((f) => !selectedItems.includes(f.id)));
        setSelectedItems([]);
    };

    const handleToggleSelect = (id: string) => {
        setSelectedItems((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (selectedItems.length === filteredFavorites.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredFavorites.map((f) => f.id));
        }
    };

    const handleCreateCollection = () => {
        if (!newCollectionName.trim()) return;
        const colors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500'];
        const newCollection: Collection = {
            id: `c-${Date.now()}`,
            name: newCollectionName,
            count: 0,
            color: colors[Math.floor(Math.random() * colors.length)],
        };
        setCollections((prev) => [...prev, newCollection]);
        setNewCollectionName('');
        setShowNewCollection(false);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <HeartIconSolid className="w-8 h-8 text-red-500" />
                            Favorites
                        </h1>
                        <p className="text-gray-400 mt-1">
                            {favorites.length} saved material{favorites.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex gap-3">
                        {selectedItems.length > 0 && (
                            <>
                                <Link
                                    to={`/compare?ids=${selectedItems.join(',')}`}
                                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                                >
                                    <ArrowsRightLeftIcon className="w-5 h-5" />
                                    Compare ({selectedItems.length})
                                </Link>
                                <button
                                    onClick={handleRemoveSelected}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                    Remove
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar - Collections */}
                    <div className="lg:col-span-1">
                        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <FolderIcon className="w-5 h-5 text-gray-400" />
                                    Collections
                                </h3>
                                <button
                                    onClick={() => setShowNewCollection(true)}
                                    className="p-1 hover:bg-gray-700 rounded transition-colors"
                                >
                                    <PlusIcon className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            {showNewCollection && (
                                <div className="mb-4 flex gap-2">
                                    <input
                                        type="text"
                                        value={newCollectionName}
                                        onChange={(e) => setNewCollectionName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateCollection()}
                                        placeholder="Collection name"
                                        className="flex-1 px-3 py-1.5 bg-gray-900 border border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleCreateCollection}
                                        className="px-2 py-1 bg-emerald-600 rounded-lg text-sm"
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setShowNewCollection(false)}
                                        className="px-2 py-1 bg-gray-700 rounded-lg"
                                    >
                                        <XMarkIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            )}

                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCollection(null)}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${selectedCollection === null
                                            ? 'bg-emerald-600/20 text-emerald-400'
                                            : 'hover:bg-gray-700 text-gray-300'
                                        }`}
                                >
                                    <span>All Favorites</span>
                                    <span className="text-sm text-gray-500">{favorites.length}</span>
                                </button>
                                {collections.map((col) => (
                                    <button
                                        key={col.id}
                                        onClick={() => setSelectedCollection(col.name)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${selectedCollection === col.name
                                                ? 'bg-emerald-600/20 text-emerald-400'
                                                : 'hover:bg-gray-700 text-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${col.color}`}></div>
                                            <span>{col.name}</span>
                                        </div>
                                        <span className="text-sm text-gray-500">{col.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Filters */}
                        <div className="flex flex-col md:flex-row gap-4 mb-6">
                            <div className="flex-1 relative">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search favorites..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleSelectAll}
                                    className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                                >
                                    {selectedItems.length === filteredFavorites.length ? 'Deselect All' : 'Select All'}
                                </button>
                                <div className="flex bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setViewMode('grid')}
                                        className={`p-2 ${viewMode === 'grid' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                                    >
                                        <Squares2X2Icon className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setViewMode('list')}
                                        className={`p-2 ${viewMode === 'list' ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                                    >
                                        <ListBulletIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Favorites */}
                        {filteredFavorites.length === 0 ? (
                            <div className="bg-gray-800 border border-gray-700 rounded-xl p-12 text-center">
                                <HeartIcon className="w-12 h-12 mx-auto text-gray-600 mb-4" />
                                <h3 className="text-lg font-medium text-gray-300">No favorites yet</h3>
                                <p className="text-gray-500 mt-1">Start saving materials you're interested in</p>
                                <Link
                                    to="/search"
                                    className="inline-block mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors"
                                >
                                    Browse Materials
                                </Link>
                            </div>
                        ) : viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {filteredFavorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className={`bg-gray-800 border rounded-xl overflow-hidden transition-all ${selectedItems.includes(fav.id)
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                                : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        {/* Image */}
                                        <div className="relative h-40 bg-gray-700">
                                            {fav.image ? (
                                                <img src={fav.image} alt={fav.productName} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ShoppingCartIcon className="w-12 h-12 text-gray-600" />
                                                </div>
                                            )}
                                            <button
                                                onClick={() => handleToggleSelect(fav.id)}
                                                className={`absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${selectedItems.includes(fav.id)
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-gray-400 hover:border-emerald-500'
                                                    }`}
                                            >
                                                {selectedItems.includes(fav.id) && (
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleRemoveFavorite(fav.id)}
                                                className="absolute top-3 right-3 p-1.5 bg-gray-900/80 rounded-full hover:bg-red-600/80 transition-colors"
                                            >
                                                <HeartIconSolid className="w-5 h-5 text-red-500" />
                                            </button>
                                            {fav.collection && (
                                                <div className="absolute bottom-3 left-3 px-2 py-1 bg-gray-900/80 rounded text-xs">
                                                    {fav.collection}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <Link
                                                to={`/product/${fav.productId}`}
                                                className="font-medium hover:text-emerald-400 transition-colors line-clamp-2"
                                            >
                                                {fav.productName}
                                            </Link>
                                            <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                                                <BuildingOffice2Icon className="w-4 h-4" />
                                                {fav.supplier.name}
                                            </div>

                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700">
                                                <div>
                                                    <div className="text-lg font-bold text-emerald-400">${fav.price.toLocaleString()}</div>
                                                    <div className="text-xs text-gray-500">per {fav.unit}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <GlobeAltIcon className="w-4 h-4 text-gray-500" />
                                                        <span className={fav.carbonFootprint < 0 ? 'text-green-400' : 'text-gray-300'}>
                                                            {fav.carbonFootprint < 0 ? '' : '+'}
                                                            {fav.carbonFootprint} kg
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-500">CO2e/{fav.unit}</div>
                                                </div>
                                            </div>

                                            {fav.certifications.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-3">
                                                    {fav.certifications.slice(0, 2).map((cert) => (
                                                        <span
                                                            key={cert}
                                                            className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs"
                                                        >
                                                            <CheckBadgeIcon className="w-3 h-3" />
                                                            {cert}
                                                        </span>
                                                    ))}
                                                    {fav.certifications.length > 2 && (
                                                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                                                            +{fav.certifications.length - 2}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredFavorites.map((fav) => (
                                    <div
                                        key={fav.id}
                                        className={`bg-gray-800 border rounded-xl p-4 transition-all ${selectedItems.includes(fav.id)
                                                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                                : 'border-gray-700 hover:border-gray-600'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleSelect(fav.id)}
                                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${selectedItems.includes(fav.id)
                                                        ? 'bg-emerald-500 border-emerald-500'
                                                        : 'border-gray-400 hover:border-emerald-500'
                                                    }`}
                                            >
                                                {selectedItems.includes(fav.id) && (
                                                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                        <path
                                                            fillRule="evenodd"
                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                            clipRule="evenodd"
                                                        />
                                                    </svg>
                                                )}
                                            </button>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3">
                                                    <Link
                                                        to={`/product/${fav.productId}`}
                                                        className="font-medium hover:text-emerald-400 transition-colors"
                                                    >
                                                        {fav.productName}
                                                    </Link>
                                                    {fav.collection && (
                                                        <span className="px-2 py-0.5 bg-gray-700 rounded text-xs text-gray-400">
                                                            {fav.collection}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <BuildingOffice2Icon className="w-4 h-4" />
                                                        {fav.supplier.name}
                                                    </span>
                                                    <span>{fav.category}</span>
                                                    <span>Added {formatDate(fav.addedAt)}</span>
                                                </div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className="text-lg font-bold text-emerald-400">${fav.price.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">per {fav.unit}</div>
                                            </div>

                                            <div className="text-right shrink-0">
                                                <div className={`text-sm ${fav.carbonFootprint < 0 ? 'text-green-400' : 'text-gray-300'}`}>
                                                    {fav.carbonFootprint < 0 ? '' : '+'}
                                                    {fav.carbonFootprint} kg CO2e
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => handleRemoveFavorite(fav.id)}
                                                className="p-2 hover:bg-gray-700 rounded-lg transition-colors shrink-0"
                                            >
                                                <TrashIcon className="w-5 h-5 text-gray-400 hover:text-red-400" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
