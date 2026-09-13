import { useMemo } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { useActiveCart } from '../../data/cart-store';
import { useT } from '../../i18n';
import { CartClearButton } from './components/cart-clear-button';
import { CartPanel } from './components/cart-panel';
import { PosSubHeader } from './components/pos-sub-header';
import { useCartRepricing } from './hooks/use-wholesale-pricing';
import { cartUnitCount } from './lib/cart-totals';
import { cartLabel, countLabel } from './lib/order-label';

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
  // The sell screen is not mounted behind this route on the phone, so the order is re-priced
  // here too: a quantity changed on this screen may cross a tier.
  useCartRepricing(cart);

  return (
    <View className="flex-1">
      <PosSubHeader
        title={cartLabel(t, cart)}
        subtitle={countLabel(t, cartUnitCount(cart), 'pos.cart.items')}
        trailing={<CartClearButton disabled={cart.lines.length === 0} />}
      />
      <CartPanel products={activeProducts} desktop={false} showHeader={false} />
    </View>
  );
}
