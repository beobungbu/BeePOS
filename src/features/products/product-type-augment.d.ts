import type {} from '../../domain/types';

/**
 * The product screen spec (docs/product-spec.md) requires a free-text description field
 * on the product form, but the phase-0-owned `src/domain/types.ts#Product` type does not
 * declare one. Rather than editing that phase-0-owned file, this module augmentation adds
 * `description` to `Product` for the whole program (TypeScript merges declarations of the
 * same interface name across files). Safe: it only widens the type, never narrows it, and
 * every other phase's existing `Product` usage stays structurally compatible.
 */
declare module '../../domain/types' {
  interface Product {
    description?: string;
  }
}
