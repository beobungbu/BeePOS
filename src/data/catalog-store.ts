import { create } from 'zustand';
import type { Category, Product, ProductVariant } from '../domain/types';
import { categories as seedCategories, products as seedProducts } from './seed';

interface CatalogState {
  products: Product[];
  categories: Category[];
  upsertProduct: (product: Product) => void;
  setProductActive: (productId: string, isActive: boolean) => void;
  removeProduct: (productId: string) => void;
  upsertCategory: (category: Category) => void;
  removeCategory: (categoryId: string) => void;
  upsertVariant: (productId: string, variant: ProductVariant) => void;
  removeVariant: (productId: string, variantId: string) => void;
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

  removeProduct: (productId) =>
    set((state) => ({ products: state.products.filter((item) => item.id !== productId) })),

  upsertCategory: (category) =>
    set((state) => {
      const exists = state.categories.some((item) => item.id === category.id);
      return {
        categories: exists
          ? state.categories.map((item) => (item.id === category.id ? category : item))
          : [...state.categories, category],
      };
    }),

  removeCategory: (categoryId) =>
    set((state) => ({
      categories: state.categories.filter(
        (item) => item.id !== categoryId && item.parentId !== categoryId,
      ),
    })),

  upsertVariant: (productId, variant) =>
    set((state) => ({
      products: state.products.map((product) => {
        if (product.id !== productId) return product;
        const variants = product.variants ?? [];
        const exists = variants.some((item) => item.id === variant.id);
        return {
          ...product,
          variants: exists
            ? variants.map((item) => (item.id === variant.id ? variant : item))
            : [...variants, variant],
        };
      }),
    })),

  removeVariant: (productId, variantId) =>
    set((state) => ({
      products: state.products.map((product) =>
        product.id === productId
          ? { ...product, variants: (product.variants ?? []).filter((item) => item.id !== variantId) }
          : product,
      ),
    })),
}));
