// frontend/src/pages/BuyerExplorationPage.tsx
import React, { useState } from 'react';
import { Filter, Search, Grid3X3, LayoutList } from 'lucide-react';
import { MOCK_PRODUCTS, type MockProduct } from '../mocks/productData';
import { useProductFilters } from '../hooks/useProductFilters';
import SearchFilterSidebar from '../components/search/SearchFilterSidebar';
import EnhancedProductCard from '../components/products/EnhancedProductCard';
import ProductDetailModal from '../components/products/ProductDetailModal';
import RequestSpecsModal from '../components/modals/RequestSpecsModal';
import CompareBar from '../components/CompareBar';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { SearchX } from 'lucide-react';

const PRODUCTS_PER_PAGE = 12;

const BuyerExplorationPage: React.FC = () => {
  // Filter state
  const {
    filters,
    filteredProducts,
    actions,
    matchingCount,
    totalProducts,
  } = useProductFilters(MOCK_PRODUCTS);

  // UI state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<MockProduct | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isSpecsModalOpen, setIsSpecsModalOpen] = useState(false);
  const [specsProduct, setSpecsProduct] = useState<MockProduct | null>(null);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  // Handle product card click
  const handleProductClick = (product: MockProduct) => {
    setSelectedProduct(product);
    setIsDetailModalOpen(true);
  };

  // Handle request specs
  const handleRequestSpecs = (product: MockProduct) => {
    setSpecsProduct(product);
    setIsDetailModalOpen(false);
    setIsSpecsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gradient-primary">
            Explore Sustainable Materials
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Discover verified sustainable building materials from trusted suppliers. 
            Compare EPD data, certifications, and embodied carbon to make informed decisions.
          </p>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            {/* Mobile filter button */}
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg 
                hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-5 h-5" />
              <span className="font-medium">Filters</span>
            </button>

            {/* Search input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => actions.setSearchQuery(e.target.value)}
                placeholder="Search products, suppliers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#4C7D5D] focus:border-transparent"
              />
            </div>

            {/* View mode toggle */}
            <div className="hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[#4C7D5D] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[#4C7D5D] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="List view"
              >
                <LayoutList className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <SearchFilterSidebar
            filters={filters}
            actions={actions}
            matchingCount={matchingCount}
            totalCount={totalProducts}
          />

          {/* Mobile Sidebar */}
          <SearchFilterSidebar
            filters={filters}
            actions={actions}
            matchingCount={matchingCount}
            totalCount={totalProducts}
            isOpen={isMobileFilterOpen}
            onClose={() => setIsMobileFilterOpen(false)}
          />

          {/* Product Grid */}
          <main className="flex-1 min-w-0">
            {/* Results count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-600">
                Showing <span className="font-semibold">{paginatedProducts.length}</span> of{' '}
                <span className="font-semibold">{matchingCount}</span> products
              </p>
            </div>

            {/* Product grid/list */}
            {paginatedProducts.length > 0 ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {paginatedProducts.map(product => (
                  <EnhancedProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No products found"
                description="Try adjusting your filters or search query to find what you're looking for."
                icon={SearchX}
              />
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        onRequestSpecs={handleRequestSpecs}
      />

      {/* Request Specs Modal */}
      {specsProduct && (
        <RequestSpecsModal
          isOpen={isSpecsModalOpen}
          onClose={() => {
            setIsSpecsModalOpen(false);
            setSpecsProduct(null);
          }}
          supplierName={specsProduct.supplier}
          productName={specsProduct.name}
          productId={specsProduct.id}
        />
      )}

      {/* Compare Bar */}
      <CompareBar />
    </div>
  );
};

export default BuyerExplorationPage;
