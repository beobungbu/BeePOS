import { Dialog, DialogContent, DialogTitle, EmptyState, ListGroup, ListItem, SearchInput } from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { useCatalogStore } from '../../data/catalog-store';
import { formatVND } from '../../domain/money';
import type { Product } from '../../domain/types';
import { useT } from '../../i18n';

interface ProductPickerProps {
  open: boolean;
  onClose: () => void;
  onPick: (product: Product) => void;
  /** Products already added, excluded from results so a line cannot be duplicated. */
  excludeIds?: string[];
}

export function ProductPicker({ open, onClose, onPick, excludeIds = [] }: ProductPickerProps) {
  const t = useT();
  const products = useCatalogStore((state) => state.products);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products
      .filter((product) => !excludeIds.includes(product.id))
      .filter(
        (product) =>
          normalized.length === 0 ||
          product.name.toLowerCase().includes(normalized) ||
          product.sku.toLowerCase().includes(normalized),
      )
      .slice(0, 30);
  }, [products, query, excludeIds]);

  function handlePick(product: Product) {
    onPick(product);
    setQuery('');
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogTitle>{t('inventory.receipts.addLine')}</DialogTitle>
        <SearchInput
          placeholder={t('inventory.receipts.searchProduct')}
          defaultValue={query}
          onChangeText={setQuery}
        />
        {results.length === 0 ? (
          <EmptyState title={t('products.noResultsTitle')} description={t('products.noResultsDescription')} />
        ) : (
          <ListGroup>
            {results.map((product) => (
              <ListItem
                key={product.id}
                title={product.name}
                description={`${product.sku} · ${formatVND(product.costPrice)}`}
                onPress={() => handlePick(product)}
              />
            ))}
          </ListGroup>
        )}
      </DialogContent>
    </Dialog>
  );
}
