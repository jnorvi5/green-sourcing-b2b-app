// frontend/src/components/search/FilterSidebar.tsx
import React from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import MaterialTypeFilter from './MaterialTypeFilter';
import CertificationFilter from './CertificationFilter';
import CarbonRangeSlider from './CarbonRangeSlider';
import type { FilterState, FilterActions, MaterialType, Certification } from '../../types/filters';

interface FilterSidebarProps {
  filters: FilterState;
  actions: FilterActions;
  matchingCount: number;
  totalCount: number;
  isOpen?: boolean;
  onClose?: () => void;
}

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  );
};

const SearchFilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  actions,
  matchingCount,
  totalCount,
  isOpen = true,
  onClose,
}) => {
  const hasActiveFilters =
    filters.materialTypes.length > 0 ||
    filters.certifications.length > 0 ||
    filters.carbonRange[0] !== 0 ||
    filters.carbonRange[1] !== 200;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-[#4C7D5D]" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="py-3 text-sm text-gray-600">
        Showing <span className="font-semibold text-gray-900">{matchingCount}</span> of{' '}
        <span className="font-semibold text-gray-900">{totalCount}</span> products
      </div>

      {/* Clear all button */}
      {hasActiveFilters && (
        <button
          onClick={actions.clearAllFilters}
          className="w-full py-2 px-4 text-sm font-medium text-[#4C7D5D] border border-[#4C7D5D] 
            rounded-lg hover:bg-[#4C7D5D]/5 transition-colors mb-4"
        >
          Clear All Filters
        </button>
      )}

      {/* Filter sections */}
      <FilterSection title="Material Type">
        <MaterialTypeFilter
          selected={filters.materialTypes}
          onChange={(type: MaterialType) => actions.toggleMaterialType(type)}
        />
      </FilterSection>

      <FilterSection title="Certification">
        <CertificationFilter
          selected={filters.certifications}
          onChange={(cert: Certification) => actions.toggleCertification(cert)}
        />
      </FilterSection>

      <FilterSection title="Embodied Carbon Range">
        <CarbonRangeSlider
          value={filters.carbonRange}
          onChange={actions.setCarbonRange}
          min={0}
          max={200}
        />
      </FilterSection>
    </>
  );

  // Desktop sidebar (sticky)
  if (!onClose) {
    return (
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-24 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          {sidebarContent}
        </div>
      </aside>
    );
  }

  // Mobile drawer
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] bg-white shadow-xl 
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full overflow-y-auto p-4">{sidebarContent}</div>
      </div>
    </>
  );
};

export default SearchFilterSidebar;
