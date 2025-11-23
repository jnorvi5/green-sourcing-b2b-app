import { create } from 'zustand';
import type { MockProduct } from '../mocks/productData';

interface ComparisonStore {
  products: MockProduct[];
  addProduct: (product: MockProduct) => void;
  removeProduct: (productId: string | number) => void;
  clearComparison: () => void;
}

export const useComparisonStore = create<ComparisonStore>((set) => ({
  products: [],
  addProduct: (product) =>
    set((state) => {
      if (state.products.length >= 3) {
        return state; // Limit to 3
      }
      if (state.products.find((p) => p.id === product.id)) {
        return state; // Prevent duplicates
      }
      return { products: [...state.products, product] };
    }),
  removeProduct: (productId) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== productId),
    })),
  clearComparison: () => set({ products: [] }),
}));
