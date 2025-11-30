// frontend/src/hooks/useProductFilters.ts
import { useState, useCallback, useMemo } from 'react';
import type { 
  FilterState, 
  FilterActions, 
  MaterialType, 
  Certification 
} from '../types/filters';
import { DEFAULT_CARBON_RANGE } from '../types/filters';
import type { MockProduct } from '../mocks/productData';

const initialFilterState: FilterState = {
  materialTypes: [],
  certifications: [],
  carbonRange: DEFAULT_CARBON_RANGE,
  searchQuery: '',
};

export function useProductFilters(products: MockProduct[]) {
  const [filters, setFilters] = useState<FilterState>(initialFilterState);

  const setMaterialTypes = useCallback((types: MaterialType[]) => {
    setFilters(prev => ({ ...prev, materialTypes: types }));
  }, []);

  const toggleMaterialType = useCallback((type: MaterialType) => {
    setFilters(prev => ({
      ...prev,
      materialTypes: prev.materialTypes.includes(type)
        ? prev.materialTypes.filter(t => t !== type)
        : [...prev.materialTypes, type],
    }));
  }, []);

  const setCertifications = useCallback((certs: Certification[]) => {
    setFilters(prev => ({ ...prev, certifications: certs }));
  }, []);

  const toggleCertification = useCallback((cert: Certification) => {
    setFilters(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  }, []);

  const setCarbonRange = useCallback((range: [number, number]) => {
    setFilters(prev => ({ ...prev, carbonRange: range }));
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    setFilters(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters(initialFilterState);
  }, []);

  // Filter products based on current filter state
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const nameMatch = product.name.toLowerCase().includes(query);
        const supplierMatch = product.supplier.toLowerCase().includes(query);
        const descriptionMatch = product.description?.toLowerCase().includes(query);
        if (!nameMatch && !supplierMatch && !descriptionMatch) {
          return false;
        }
      }

      // Material type filter
      if (filters.materialTypes.length > 0 && product.materialType) {
        if (!filters.materialTypes.includes(product.materialType as MaterialType)) {
          return false;
        }
      }

      // Certification filter
      if (filters.certifications.length > 0) {
        const productCerts = product.certifications || [];
        const hasMatchingCert = filters.certifications.some(cert => 
          productCerts.includes(cert)
        );
        if (!hasMatchingCert) {
          return false;
        }
      }

      // Carbon range filter
      const carbonValue = product.embodiedCarbon ?? product.epd?.gwp ?? 0;
      if (carbonValue < filters.carbonRange[0] || carbonValue > filters.carbonRange[1]) {
        return false;
      }

      return true;
    });
  }, [products, filters]);

  const actions: FilterActions = {
    setMaterialTypes,
    toggleMaterialType,
    setCertifications,
    toggleCertification,
    setCarbonRange,
    setSearchQuery,
    clearAllFilters,
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.materialTypes.length > 0) count++;
    if (filters.certifications.length > 0) count++;
    if (filters.carbonRange[0] !== DEFAULT_CARBON_RANGE[0] || 
        filters.carbonRange[1] !== DEFAULT_CARBON_RANGE[1]) count++;
    if (filters.searchQuery) count++;
    return count;
  }, [filters]);

  return {
    filters,
    filteredProducts,
    actions,
    activeFilterCount,
    totalProducts: products.length,
    matchingCount: filteredProducts.length,
  };
}
