import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import SearchBar from '../components/SearchBar';
import FilterPanel from '../components/FilterPanel';
import ProductGrid from '../components/ProductGrid';
import ProductGridSkeleton from '../components/ProductGridSkeleton';
import Pagination from '../components/Pagination';
import type { Product } from '../types';
import { fetchProducts, toFrontendProduct, type ProductFilters } from '../lib/products-api';
import { useIntercomTracking } from '../hooks/useIntercomTracking';

const ITEMS_PER_PAGE = 20;
const DEBOUNCE_DELAY = 300; // ms to wait before triggering API call

const SearchPage = () => {
  const { trackSearch } = useIntercomTracking();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [materialTypes, setMaterialTypes] = useState<string[]>([]);
  const [application, setApplication] = useState<string[]>([]);
  const [certifications, setCertifications] = useState<string[]>([]);
  const [location, setLocation] = useState('');
  const [recycledContent, setRecycledContent] = useState(0);
  const [carbonFootprint, setCarbonFootprint] = useState(50);
  const [vocLevel, setVocLevel] = useState(500);

  // OPTIMIZED: Debounce ref to prevent excessive API calls on rapid filter changes
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch products from MongoDB API
  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const filters: ProductFilters = {
      search: searchQuery,
      status: 'active',
      limit: ITEMS_PER_PAGE,
      offset: (currentPage - 1) * ITEMS_PER_PAGE,
    };

    // Map material types to categories
    if (materialTypes.length > 0) {
      filters.category = materialTypes[0]; // API supports single category for now
    }

    // Add certification filters
    if (certifications.length > 0) {
      filters.certifications = certifications;
    }

    // Add sustainability filters
    if (recycledContent > 0) {
      filters.minRecycled = recycledContent;
    }
    if (carbonFootprint < 50) {
      filters.maxCarbon = carbonFootprint;
    }

    try {
      const response = await fetchProducts(filters);

      if (response.success) {
        // Convert MongoDB products to frontend format
        const frontendProducts = response.data.map(toFrontendProduct) as Product[];
        setProducts(frontendProducts);
        setTotalProducts(response.pagination.total);
        setHasMore(response.pagination.hasMore);

        // Track search for analytics
        if (searchQuery) {
          trackSearch(searchQuery, response.pagination.total);
        }
      } else {
        setError(response.error || 'Failed to load products');
        setProducts([]);
      }
    } catch (err) {
      setError('Failed to connect to product service');
      setProducts([]);
    } finally {
      setLoading(false);
    }
    // Note: trackSearch is intentionally excluded from deps - it's used for analytics 
    // and shouldn't trigger re-fetches. The hook should memoize it internally.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, materialTypes, certifications, recycledContent, carbonFootprint, currentPage]);

  // OPTIMIZED: Consolidated and debounced filter effect
  // Before: Two separate useEffect hooks causing potential double API calls
  // After: Single debounced effect that resets page and fetches data
  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the API call to prevent excessive requests during rapid filter changes
    debounceTimerRef.current = setTimeout(() => {
      loadProducts();
    }, DEBOUNCE_DELAY);

    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [loadProducts]);

  // Reset to page 1 when filters change (not on page change)
  // Using JSON.stringify for more robust serialization that handles special characters
  const filterDependencies = useMemo(() => 
    JSON.stringify([searchQuery, materialTypes, application, certifications, location, recycledContent, carbonFootprint, vocLevel]),
    [searchQuery, materialTypes, application, certifications, location, recycledContent, carbonFootprint, vocLevel]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterDependencies]);

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-center my-8">Product Search</h1>
      <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Results count */}
      {!loading && (
        <p className="text-gray-600 mt-4 text-center">
          {totalProducts > 0
            ? `Showing ${products.length} of ${totalProducts} sustainable products`
            : 'No products found. Try adjusting your filters.'}
        </p>
      )}

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      )}

      <div className="flex mt-8">
        <div className="w-1/4">
          <FilterPanel
            materialTypes={materialTypes}
            setMaterialTypes={setMaterialTypes}
            application={application}
            setApplication={setApplication}
            certifications={certifications}
            setCertifications={setCertifications}
            location={location}
            setLocation={setLocation}
            recycledContent={recycledContent}
            setRecycledContent={setRecycledContent}
            carbonFootprint={carbonFootprint}
            setCarbonFootprint={setCarbonFootprint}
            vocLevel={vocLevel}
            setVocLevel={setVocLevel}
          />
        </div>
        <div className="w-3/4 pl-8">
          {loading ? (
            <ProductGridSkeleton />
          ) : (
            <>
              <ProductGrid products={products} />

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;



