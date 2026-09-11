import { useMemo } from 'react';
import { View } from 'react-native';
import { Button, ButtonLabel, SafeArea, Screen, Text } from '@beemvp/beeui-ui';
import { useCatalogStore } from '../../data/catalog-store';
import { useT } from '../../i18n';
import { goBackOr } from '../../lib/navigation';
import { CartPanel } from './components/cart-panel';

/**
 * Full-screen native fallback for the cart `Sheet` (BeeUI #584: `Sheet` never presents on
 * iOS). Reuses the same `CartPanel` used by the wide-layout cart pane and the web `Sheet`,
 * behind a simple back header instead of a bottom sheet. Remove this route (and the
 * `Platform.OS` branch in `pos-screen.tsx` that navigates here) once #584 lands.
 */
export default function CartScreen() {
  const t = useT();
  const products = useCatalogStore((state) => state.products);
  const activeProducts = useMemo(() => products.filter((product) => product.isActive), [products]);

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <View className="flex-row items-center justify-between border-b border-border px-2 py-2">
          <Button variant="ghost" size="sm" onPress={() => goBackOr('/pos')}>
            <ButtonLabel>{`< ${t('common.actions.back')}`}</ButtonLabel>
          </Button>
          <Text className="text-base font-semibold text-foreground">{t('pos.cart.title')}</Text>
          <View className="w-16" />
        </View>
        <CartPanel products={activeProducts} />
      </SafeArea>
    </Screen>
  );
}
