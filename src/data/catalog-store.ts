import { create } from 'zustand';
import type { Category, Product } from '../domain/types';
import { categories as seedCategories, products as seedProducts } from './seed';

interface CatalogState {
  products: Product[];
  categories: Category[];
  upsertProduct: (product: Product) => void;
  setProductActive: (productId: string, isActive: boolean) => void;
  upsertCategory: (category: Category) => void;
}

export const useCatalogStore = create<CatalogState>((set) => ({
  products: seedProducts,
  categories: seedCategories,

  upsertProduct: (product) =>
    set((state) => {
      const exists = state.products.some((item) => item.id === product.id);
      return {
        products: exists
          ? state.products.map((item) => (item.id === product.id ? product : item))
          : [...state.products, product],
      };
    }),

  setProductActive: (productId, isActive) =>
    set((state) => ({
      products: state.products.map((item) =>
        item.id === productId ? { ...item, isActive } : item,
      ),
    })),

  upsertCategory: (category) =>
    set((state) => {
      const exists = state.categories.some((item) => item.id === category.id);
      return {
        categories: exists
          ? state.categories.map((item) => (item.id === category.id ? category : item))
          : [...state.categories, category],
      };
    }),
}));
