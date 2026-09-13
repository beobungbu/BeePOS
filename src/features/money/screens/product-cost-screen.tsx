import { EmptyState, Text } from '@beemvp/beeui-ui';
import { useLocalSearchParams } from 'expo-router';
import { useCatalogStore } from '../../../data/catalog-store';
import { useScreenHeader } from '../../../components/shell/screen-header';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';
import { ProductCostHistory } from '../components/product-cost-history';
import { MoneyScreen } from '../components/money-screen';

/**
 * `/money/cost/<productId>`: the cost history of one product on a route of its own.
 *
 * The same component is what the product detail's "Giá vốn" tab renders, but the ledger has to
 * be reachable from the money area too: a manager checking why a margin moved starts from the
 * cost side, not from the catalogue.
 */
export function ProductCostScreen() {
  const t = useT();
  const params = useLocalSearchParams<{ productId?: string }>();
  const productId = params.productId ?? '';
  const product = useCatalogStore((state) => state.products).find((item) => item.id === productId);

  useScreenHeader({
    title: t('money.cost.title'),
    subtitle: fill(t('money.cost.subtitle'), { product: product?.name ?? productId }),
    backTo: '/money/cashbook',
  });

  return (
    <MoneyScreen>
      {product ? (
        <>
          <Text variant="title">{product.name}</Text>
          <ProductCostHistory productId={product.id} />
        </>
      ) : (
        <EmptyState title={t('money.cost.empty')} description="" />
      )}
    </MoneyScreen>
  );
}
