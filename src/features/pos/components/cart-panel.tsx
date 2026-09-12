import { useEffect } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonLabel, EmptyState, Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { useActiveCart, useCartStore } from '../../../data/cart-store';
import { useCustomerStore } from '../../../data/customer-store';
import { cartTotalsOf, cartUnitCount } from '../lib/cart-totals';
import { countLabel, orderLabel } from '../lib/order-label';
import { CartClearButton } from './cart-clear-button';
import { CartLineItem } from './cart-line-item';
import { CustomerDialog } from './customer-dialog';
import { OrderDiscountDialog } from './order-discount-dialog';
import { OrderNoteDialog } from './order-note-dialog';
import { OrderTotalsPanel } from './order-totals-panel';

interface CartPanelProps {
  products: Product[];
  /** Desktop: the pane is permanent, shows the line remove control and binds F9. */
  desktop: boolean;
  /** The pushed `/pos/cart` route names the order in its own header, so it hides this one. */
  showHeader?: boolean;
}

/**
 * The order being served: pane on desktop, the `/pos/cart` route on phone and tablet. The
 * header names the order ("Đơn 1", never "Giỏ hàng") because several orders are open at
 * once, and the total rides on the pay button, following Square.
 */
export function CartPanel({ products, desktop, showHeader = true }: CartPanelProps) {
  const t = useT();
  const router = useRouter();
  const cart = useActiveCart();
  const setQty = useCartStore((state) => state.setQty);
  const setLineDiscount = useCartStore((state) => state.setLineDiscount);
  const removeLine = useCartStore((state) => state.removeLine);
  const setOrderDiscount = useCartStore((state) => state.setOrderDiscount);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const setNote = useCartStore((state) => state.setNote);
  const customers = useCustomerStore((state) => state.customers);

  const totals = cartTotalsOf(cart, products);
  const isEmpty = cart.lines.length === 0;

  useEffect(() => {
    if (!desktop || Platform.OS !== 'web') return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'F9' || isEmpty) return;
      event.preventDefault();
      router.push('/pos/checkout');
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [desktop, isEmpty, router]);

  return (
    <View className="flex-1 bg-surface">
      {showHeader ? (
      <View className="h-14 flex-row items-center gap-2 border-b border-border px-4">
        <Text className="flex-1 text-heading font-semibold text-foreground">
          {orderLabel(t, cart.ordinal)}
        </Text>
        {isEmpty ? null : (
          <View className="rounded-full bg-muted px-2 py-0.5">
            <Text className="text-caption tabular-nums text-muted-foreground">
              {countLabel(t, cartUnitCount(cart), 'pos.cart.items')}
            </Text>
          </View>
        )}
        <CartClearButton disabled={isEmpty} />
      </View>
      ) : null}

      <CustomerDialog customers={customers} selectedCustomerId={cart.customerId} onSelect={setCustomer} />

      {isEmpty ? (
        <View className="flex-1 items-center px-6 pt-10">
          <View className="w-full max-w-[280px]">
            <EmptyState title={t('pos.cart.emptyTitle')} description={t('pos.cart.emptyDescription')} />
          </View>
        </View>
      ) : (
        <ScrollView className="flex-1">
          {cart.lines.map((line) => (
            <CartLineItem
              key={line.productId}
              line={line}
              product={products.find((product) => product.id === line.productId)}
              showRemoveControl={desktop}
              onSetQty={(qty) => setQty(line.productId, qty)}
              onSetDiscount={(discount) => setLineDiscount(line.productId, discount)}
              onRemove={() => removeLine(line.productId)}
            />
          ))}
        </ScrollView>
      )}

      <View className="gap-2 border-t border-border p-4">
        <OrderTotalsPanel totals={totals} bordered={false} />

        <Button
          className="mt-1 min-h-[52px]"
          disabled={isEmpty}
          onPress={() => router.push('/pos/checkout')}
        >
          <ButtonLabel>{`${t('pos.cart.checkout')} · ${formatVND(totals.total)}`}</ButtonLabel>
          {desktop ? (
            <View className="ml-2 rounded-sm border border-primary-foreground px-1.5">
              <Text className="text-caption text-primary-foreground">F9</Text>
            </View>
          ) : null}
        </Button>

        <View className="mt-1 flex-row gap-2">
          <OrderDiscountDialog discount={cart.discount} onApply={setOrderDiscount} />
          <OrderNoteDialog note={cart.note} onApply={setNote} />
        </View>
      </View>
    </View>
  );
}
