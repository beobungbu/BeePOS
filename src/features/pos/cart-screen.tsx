import { useMemo } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useActiveCart } from '../../data/cart-store';
import { useT } from '../../i18n';
import { CartClearButton } from './components/cart-clear-button';
import { CartPanel } from './components/cart-panel';
import { PosSubHeader } from './components/pos-sub-header';
import { cartUnitCount } from './lib/cart-totals';
import { countLabel, orderLabel } from './lib/order-label';

/**
 * The cart as a pushed route, which is what phone and tablet get instead of the desktop
 * pane. Not a `Sheet`: BeeUI's `Sheet` never presents on iOS (BeeUI #584), and the direction
 * doc bans sheets on native outright.
 */
export default function CartScreen() {
  const t = useT();
  const cart = useActiveCart();
  const products = useCatalogStore((state) => state.products);
  const activeProducts = useMemo(() => products.filter((product) => product.isActive), [products]);

  return (
    <View className="flex-1">
      <PosSubHeader
        title={orderLabel(t, cart.ordinal)}
        subtitle={countLabel(t, cartUnitCount(cart), 'pos.cart.items')}
        trailing={<CartClearButton disabled={cart.lines.length === 0} />}
      />
      <CartPanel products={activeProducts} desktop={false} showHeader={false} />
    </View>
  );
}
