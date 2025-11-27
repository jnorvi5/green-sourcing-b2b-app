/**
 * Advanced Search Filters Component
 * 
 * Provides comprehensive filtering for materials search:
 * - Price range
 * - Carbon footprint range
 * - Lead time
 * - Location/Region
 * - Certifications
 * - Material categories
 */
import { useState, useEffect } from 'react';
import {
    FunnelIcon,
    XMarkIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    MapPinIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    SparklesIcon,
} from '@heroicons/react/24/outline';

export interface SearchFilters {
    priceMin?: number;
    priceMax?: number;
    carbonMin?: number;
    carbonMax?: number;
    leadTimeMax?: number;
    location?: string[];
    certifications?: string[];
    categories?: string[];
    recycledContentMin?: number;
    epdVerified?: boolean;
    inStock?: boolean;
}

interface AdvancedSearchFiltersProps {
    filters: SearchFilters;
    onChange: (filters: SearchFilters) => void;
    onApply?: () => void;
    onReset?: () => void;
    collapsed?: boolean;
}

// Available options
const LOCATIONS = [
    'California',
    'Texas',
    'New York',
    'Washington',
    'Oregon',
    'Colorado',
    'Arizona',
    'Nevada',
    'Canada',
    'Mexico',
];

const CERTIFICATIONS = [
    'EPD Verified',
    'LEED Compliant',
    'FSC Certified',
    'Cradle to Cradle',
    'ISO 14001',
    'GreenGuard',
    'Living Building Challenge',
    'BREEAM',
    'Energy Star',
    'Carbon Neutral',
];

const CATEGORIES = [
    'Structural Steel',
    'Concrete & Cement',
    'Wood & Timber',
    'Insulation',
    'Glass & Glazing',
    'Aluminum & Metals',
    'Roofing',
    'Flooring',
    'Drywall & Gypsum',
    'Masonry',
    'Composites',
    'Recycled Materials',
];

export default function AdvancedSearchFilters({
    filters,
    onChange,
    onApply,
    onReset,
    collapsed: initialCollapsed = true,
}: AdvancedSearchFiltersProps) {
    const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
    const [expandedSections, setExpandedSections] = useState<string[]>(['price', 'carbon']);
    const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

    useEffect(() => {
        setLocalFilters(filters);
    }, [filters]);

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onChange(newFilters);
    };

    const toggleArrayFilter = (key: 'location' | 'certifications' | 'categories', value: string) => {
        const current = localFilters[key] || [];
        const newValues = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        updateFilter(key, newValues.length > 0 ? newValues : undefined);
    };

    const handleReset = () => {
        setLocalFilters({});
        onChange({});
        onReset?.();
    };

    const activeFilterCount = Object.keys(localFilters).filter(
        key => localFilters[key as keyof SearchFilters] !== undefined
    ).length;

    const FilterSection = ({
        title,
        id,
        icon: Icon,
        children,
    }: {
        title: string;
        id: string;
        icon: React.ElementType;
        children: React.ReactNode;
    }) => (
        <div className="border-b border-gray-700 last:border-b-0">
            <button
                onClick={() => toggleSection(id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-700/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="font-medium text-gray-200">{title}</span>
                </div>
                {expandedSections.includes(id) ? (
                    <ChevronUpIcon className="w-4 h-4 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="w-4 h-4 text-gray-400" />
                )}
            </button>
            {expandedSections.includes(id) && (
                <div className="px-4 pb-4">{children}</div>
            )}
        </div>
    );

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden">
            {/* Header */}
            <div
                className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700 cursor-pointer"
                onClick={() => setIsCollapsed(!isCollapsed)}
            >
                <div className="flex items-center gap-2">
                    <FunnelIcon className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-white">Filters</span>
                    {activeFilterCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                            {activeFilterCount}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {activeFilterCount > 0 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleReset();
                            }}
                            className="text-sm text-gray-400 hover:text-white transition-colors"
                        >
                            Clear all
                        </button>
                    )}
                    {isCollapsed ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </div>

            {/* Filter Sections */}
            {!isCollapsed && (
                <div className="divide-y divide-gray-700">
                    {/* Price Range */}
                    <FilterSection title="Price Range" id="price" icon={CurrencyDollarIcon}>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Min ($)</label>
                                <input
                                    type="number"
                                    value={localFilters.priceMin || ''}
                                    onChange={(e) => updateFilter('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Max ($)</label>
                                <input
                                    type="number"
                                    value={localFilters.priceMax || ''}
                                    onChange={(e) => updateFilter('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Any"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </FilterSection>

                    {/* Carbon Footprint */}
                    <FilterSection title="Carbon Footprint" id="carbon" icon={GlobeAltIcon}>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Min (kg CO2e)</label>
                                    <input
                                        type="number"
                                        value={localFilters.carbonMin || ''}
                                        onChange={(e) => updateFilter('carbonMin', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-400 mb-1">Max (kg CO2e)</label>
                                    <input
                                        type="number"
                                        value={localFilters.carbonMax || ''}
                                        onChange={(e) => updateFilter('carbonMax', e.target.value ? Number(e.target.value) : undefined)}
                                        placeholder="Any"
                                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localFilters.epdVerified || false}
                                    onChange={(e) => updateFilter('epdVerified', e.target.checked || undefined)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-300">EPD Verified Only</span>
                            </label>
                        </div>
                    </FilterSection>

                    {/* Lead Time */}
                    <FilterSection title="Lead Time" id="leadTime" icon={ClockIcon}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Maximum Days</label>
                                <input
                                    type="number"
                                    value={localFilters.leadTimeMax || ''}
                                    onChange={(e) => updateFilter('leadTimeMax', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Any"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[7, 14, 30, 60].map(days => (
                                    <button
                                        key={days}
                                        onClick={() => updateFilter('leadTimeMax', days)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${localFilters.leadTimeMax === days
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {days} days
                                    </button>
                                ))}
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={localFilters.inStock || false}
                                    onChange={(e) => updateFilter('inStock', e.target.checked || undefined)}
                                    className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                />
                                <span className="text-sm text-gray-300">In Stock Only</span>
                            </label>
                        </div>
                    </FilterSection>

                    {/* Location */}
                    <FilterSection title="Location" id="location" icon={MapPinIcon}>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {LOCATIONS.map(loc => (
                                <label key={loc} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localFilters.location?.includes(loc) || false}
                                        onChange={() => toggleArrayFilter('location', loc)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-300">{loc}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Certifications */}
                    <FilterSection title="Certifications" id="certifications" icon={ShieldCheckIcon}>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {CERTIFICATIONS.map(cert => (
                                <label key={cert} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localFilters.certifications?.includes(cert) || false}
                                        onChange={() => toggleArrayFilter('certifications', cert)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-300">{cert}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Categories */}
                    <FilterSection title="Categories" id="categories" icon={SparklesIcon}>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {CATEGORIES.map(cat => (
                                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={localFilters.categories?.includes(cat) || false}
                                        onChange={() => toggleArrayFilter('categories', cat)}
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-900 text-emerald-500 focus:ring-emerald-500"
                                    />
                                    <span className="text-sm text-gray-300">{cat}</span>
                                </label>
                            ))}
                        </div>
                    </FilterSection>

                    {/* Recycled Content */}
                    <FilterSection title="Recycled Content" id="recycled" icon={GlobeAltIcon}>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Minimum Recycled %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={localFilters.recycledContentMin || ''}
                                    onChange={(e) => updateFilter('recycledContentMin', e.target.value ? Number(e.target.value) : undefined)}
                                    placeholder="Any"
                                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {[25, 50, 75, 90].map(pct => (
                                    <button
                                        key={pct}
                                        onClick={() => updateFilter('recycledContentMin', pct)}
                                        className={`px-3 py-1 text-sm rounded-lg transition-colors ${localFilters.recycledContentMin === pct
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            }`}
                                    >
                                        {pct}%+
                                    </button>
                                ))}
                            </div>
                        </div>
                    </FilterSection>

                    {/* Apply Button */}
                    {onApply && (
                        <div className="p-4">
                            <button
                                onClick={onApply}
                                className="w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors"
                            >
                                Apply Filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Active Filters Tags (when collapsed) */}
            {isCollapsed && activeFilterCount > 0 && (
                <div className="px-4 py-3 flex flex-wrap gap-2">
                    {localFilters.priceMin !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            Min ${localFilters.priceMin}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateFilter('priceMin', undefined);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {localFilters.priceMax !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            Max ${localFilters.priceMax}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateFilter('priceMax', undefined);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {localFilters.epdVerified && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            EPD Verified
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateFilter('epdVerified', undefined);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {localFilters.leadTimeMax !== undefined && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            {localFilters.leadTimeMax} days max
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateFilter('leadTimeMax', undefined);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    )}
                    {localFilters.location?.map(loc => (
                        <span key={loc} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            {loc}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleArrayFilter('location', loc);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                    {localFilters.certifications?.map(cert => (
                        <span key={cert} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                            {cert}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleArrayFilter('certifications', cert);
                                }}
                            >
                                <XMarkIcon className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
