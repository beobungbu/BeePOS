import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  ButtonLabel,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import { MAX_OPEN_CARTS } from '../../../domain/pos';
import type { Cart, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { useCartStore } from '../../../data/cart-store';
import { cartLineCount, cartTotalsOf } from '../lib/cart-totals';
import { SecondaryButtonLabel } from './secondary-button-label';
import { countLabel, orderLabel } from '../lib/order-label';

interface OrderTabStripProps {
  products: Product[];
}

/**
 * The open-order strip of `docs/design/design-direction.md` section 6. An app composite, not
 * `Tabs`: a tab trigger in BeeUI cannot carry its own press handler and pressing the active
 * trigger does nothing, which is exactly where the close control lives. `Chip` documents no
 * remove affordance and `SegmentedControl` neither scrolls nor sizes to content.
 *
 * The close control sits beside the switch control rather than inside it, so the two presses
 * never race: nesting a pressable inside a pressable is the pitfall recorded in
 * `docs/beeui-audit/findings-00-scaffold.md`, finding scaffold-05.
 */
export function OrderTabStrip({ products }: OrderTabStripProps) {
  const t = useT();
  const toast = useToast();
  const carts = useCartStore((state) => state.carts);
  const activeCartId = useCartStore((state) => state.activeCartId);
  const openCart = useCartStore((state) => state.openCart);
  const switchCart = useCartStore((state) => state.switchCart);
  const closeCart = useCartStore((state) => state.closeCart);

  const scrollRef = useRef<ScrollView>(null);
  const [pendingCloseId, setPendingCloseId] = useState<string | undefined>(undefined);
  const pendingCart = carts.find((cart) => cart.id === pendingCloseId);
  const atLimit = carts.length >= MAX_OPEN_CARTS;

  function handleNewOrder() {
    if (!openCart()) {
      toast.show({ title: t('pos.order.maxReached'), variant: 'warning', duration: 3000 });
    }
  }

  /** An empty order closes on the spot; one with lines has to be confirmed by name. */
  function requestClose(cart: Cart) {
    if (cart.lines.length === 0) {
      closeCart(cart.id);
      return;
    }
    setPendingCloseId(cart.id);
  }

  /**
   * A new order is appended, so at eight open orders it lands past the right edge of the
   * strip. Scrolling to the end when the active order is the last one (or to the start when
   * it is the first) keeps the order the cashier just switched to on screen.
   */
  useEffect(() => {
    const index = carts.findIndex((cart) => cart.id === activeCartId);
    if (index === carts.length - 1) scrollRef.current?.scrollToEnd({ animated: true });
    else if (index === 0) scrollRef.current?.scrollTo({ x: 0, animated: true });
  }, [carts, activeCartId]);

  /**
   * Web-only shortcuts (section 6): Alt+1..8 switch, Alt+N opens, Alt+W closes through the
   * same confirmation. Matched on `event.code` because Alt+digit and Alt+letter produce
   * accented characters in `event.key` on macOS.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.code === 'KeyN') {
        event.preventDefault();
        handleNewOrder();
        return;
      }
      if (event.code === 'KeyW') {
        const active = carts.find((cart) => cart.id === activeCartId);
        if (active) {
          event.preventDefault();
          requestClose(active);
        }
        return;
      }
      const digit = /^Digit([1-8])$/.exec(event.code);
      if (digit) {
        const target = carts[Number(digit[1]) - 1];
        if (target) {
          event.preventDefault();
          switchCart(target.id);
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // Re-bound whenever the open orders change so the handler never switches to a closed one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carts, activeCartId]);

  return (
    <View className="h-12 flex-row items-center border-b border-border bg-surface-muted">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: 8, gap: 8 }}
      >
        {carts.map((cart) => (
          <OrderTab
            key={cart.id}
            cart={cart}
            products={products}
            active={cart.id === activeCartId}
            onSwitch={() => switchCart(cart.id)}
            onClose={() => requestClose(cart)}
          />
        ))}
      </ScrollView>

      <Pressable
        onPress={handleNewOrder}
        accessibilityRole="button"
        accessibilityLabel={t('pos.order.newOrder')}
        accessibilityState={{ disabled: atLimit }}
        className={`h-12 w-12 items-center justify-center border-l border-border ${atLimit ? 'opacity-40' : ''}`}
      >
        <AppIcon name="plus" tone={atLimit ? 'disabled-foreground' : 'foreground'} />
      </Pressable>

      <AlertDialog open={pendingCloseId !== undefined} onOpenChange={() => setPendingCloseId(undefined)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {pendingCart ? `${t('pos.order.closePrefix')} ${orderLabel(t, pendingCart.ordinal)}?` : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCart
              ? `${orderLabel(t, pendingCart.ordinal)} · ${countLabel(
                  t,
                  cartLineCount(pendingCart),
                  'pos.cart.lineItems',
                )} · ${formatVND(cartTotalsOf(pendingCart, products).total)}. ${t('pos.order.closeWarning')}`
              : ''}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <SecondaryButtonLabel>{t('pos.order.keep')}</SecondaryButtonLabel>
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onPress={() => {
                if (pendingCloseId) closeCart(pendingCloseId);
                setPendingCloseId(undefined);
              }}
            >
              <ButtonLabel>{t('pos.order.close')}</ButtonLabel>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}

interface OrderTabProps {
  cart: Cart;
  products: Product[];
  active: boolean;
  onSwitch: () => void;
  onClose: () => void;
}

function OrderTab({ cart, products, active, onSwitch, onClose }: OrderTabProps) {
  const t = useT();
  const label = orderLabel(t, cart.ordinal);
  const lineCount = cartLineCount(cart);
  const total = cartTotalsOf(cart, products).total;

  return (
    <View
      className={`h-9 flex-row items-center rounded-md ${
        active ? 'border border-border-strong bg-surface' : ''
      }`}
    >
      <Pressable
        onPress={onSwitch}
        accessibilityRole="button"
        accessibilityLabel={`${t('pos.order.switchTo')} ${label}`}
        accessibilityState={{ selected: active }}
        className="h-9 flex-row items-center gap-2 px-3"
      >
        {active ? <View className="h-4 w-[3px] rounded-full bg-primary" /> : null}
        <Text
          className={`text-label font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {label}
        </Text>
        {lineCount === 0 ? (
          <Text className="text-caption text-subtle-foreground">{t('pos.order.empty')}</Text>
        ) : (
          <>
            <View className="min-w-5 items-center rounded-full bg-muted px-1.5 py-0.5">
              <Text className="text-caption font-semibold tabular-nums text-foreground">{lineCount}</Text>
            </View>
            <Text
              className={`text-label font-bold tabular-nums ${
                active ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              {formatVND(total)}
            </Text>
          </>
        )}
      </Pressable>

      {active ? (
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`${t('pos.order.closePrefix')} ${label}`}
          className="mr-1 h-8 w-8 items-center justify-center rounded-sm active:bg-muted"
        >
          <AppIcon name="x" size={16} tone="muted-foreground" />
        </Pressable>
      ) : null}
    </View>
  );
}
