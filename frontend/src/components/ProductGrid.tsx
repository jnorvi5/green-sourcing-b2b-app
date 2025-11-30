import React, { useState, useEffect, useMemo, memo } from 'react';
import ProductCard from './ProductCard';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { SearchX } from 'lucide-react';
import type { Product } from '../types';

interface ProductGridProps {
  products: Product[];
}

const PRODUCTS_PER_PAGE = 24;

// OPTIMIZED: Wrapped with memo and added useMemo for expensive computations
const ProductGrid: React.FC<ProductGridProps> = memo(({ products }) => {
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    // Reset to page 1 whenever the product list changes
    setCurrentPage(1);
  }, [products]);

  // OPTIMIZED: Memoize pagination calculations to prevent recalculation on every render
  const totalPages = useMemo(() => Math.ceil(products.length / PRODUCTS_PER_PAGE), [products.length]);
  
  // OPTIMIZED: Memoize the sliced array to prevent new array creation on every render
  const paginatedProducts = useMemo(() => 
    products.slice(
      (currentPage - 1) * PRODUCTS_PER_PAGE,
      currentPage * PRODUCTS_PER_PAGE
    ),
    [products, currentPage]
  );

  return (
    <div>
      {paginatedProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedProducts.map(product => (
            <ProductCard key={product.id} product={product} supplierName={product.supplier_name} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No products found"
          description="Try adjusting your search or filters to find what you're looking for."
          icon={SearchX}
        />
      )}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
});

ProductGrid.displayName = 'ProductGrid';

export default ProductGrid;
