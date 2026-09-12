import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  ButtonLabel,
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { formatVND } from '../../../domain/money';
import { MAX_OPEN_CARTS } from '../../../domain/pos';
import type { Cart, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { isOverlayOpen } from '../../../lib/keyboard';
import { useCartStore } from '../../../data/cart-store';
import { cartLineCount, cartTotalsOf } from '../lib/cart-totals';
import { SecondaryButtonLabel } from './secondary-button-label';
import { cartLabel, countLabel, orderLabel } from '../lib/order-label';

interface OrderTabStripProps {
  products: Product[];
}

/** Horizontal padding inside the scroller, and the margin a revealed tab keeps from the edge. */
const STRIP_PADDING = 8;

/**
 * Two presses this close together are one gesture, not two switches. 320 ms sits above the
 * platform double-click defaults (macOS 250 to 300 ms) and well below a deliberate second
 * press on the tab the cashier already selected.
 */
const DOUBLE_PRESS_MS = 320;

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
  const setLabel = useCartStore((state) => state.setLabel);

  const scrollRef = useRef<ScrollView>(null);
  /** Where each tab sits inside the scroller, and what part of it is currently on screen. */
  const tabLayouts = useRef<Record<string, { x: number; width: number }>>({});
  const scrollOffset = useRef(0);
  const viewportWidth = useRef(0);
  const [pendingCloseId, setPendingCloseId] = useState<string | undefined>(undefined);
  const pendingCart = carts.find((cart) => cart.id === pendingCloseId);
  const [renameId, setRenameId] = useState<string | undefined>(undefined);
  const [renameDraft, setRenameDraft] = useState('');
  const renameCart = carts.find((cart) => cart.id === renameId);
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

  /** Opens the naming dialog on the order the gesture landed on, seeded with its name. */
  function requestRename(cart: Cart) {
    setRenameDraft(cart.label ?? '');
    setRenameId(cart.id);
  }

  /** An empty name is how the cashier gets "Đơn N" back, so blank is a valid submission. */
  function applyRename(label: string) {
    if (renameId) setLabel(renameId, label);
    setRenameId(undefined);
  }

  /**
   * Six tabs fit the 1440 working width and eight are allowed, so the active one can be off
   * screen in either direction: appended past the right edge by `Alt+N`, or scrolled out to
   * the left before `Alt+3` selects it. Scroll by measured position rather than by index, so
   * a tab that is already fully visible never moves and one that is not always comes into
   * view with a whole tab of margin.
   */
  const revealTab = useCallback((cartId: string) => {
    const layout = tabLayouts.current[cartId];
    const viewport = viewportWidth.current;
    if (!layout || viewport <= 0) return;

    const left = scrollOffset.current;
    const right = left + viewport;
    if (layout.x - STRIP_PADDING < left) {
      scrollRef.current?.scrollTo({ x: Math.max(0, layout.x - STRIP_PADDING), animated: true });
    } else if (layout.x + layout.width + STRIP_PADDING > right) {
      scrollRef.current?.scrollTo({
        x: layout.x + layout.width + STRIP_PADDING - viewport,
        animated: true,
      });
    }
  }, []);

  useEffect(() => {
    revealTab(activeCartId);
  }, [carts, activeCartId, revealTab]);

  /** A tab that closes takes its measurement with it, so a stale x never drives a scroll. */
  useEffect(() => {
    const open = new Set(carts.map((cart) => cart.id));
    for (const id of Object.keys(tabLayouts.current)) {
      if (!open.has(id)) delete tabLayouts.current[id];
    }
  }, [carts]);

  /**
   * Web-only shortcuts (section 6): Alt+1..8 switch, Alt+N opens, Alt+W closes through the
   * same confirmation. Matched on `event.code` because Alt+digit and Alt+letter produce
   * accented characters in `event.key` on macOS.
   */
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;

    function onKeyDown(event: KeyboardEvent) {
      if (!event.altKey || event.ctrlKey || event.metaKey) return;
      // None of these may move the till from behind a modal: `Alt+W` under the naming dialog
      // used to stack a close-confirmation on top of it, and `Alt+1..8` switched the order the
      // open dialog was about. No typing guard on purpose, unlike the scan listener: an Alt
      // chord is not ambiguous with typing, the caret sits in the catalog search for most of a
      // shift, and a cashier who has just pressed F3 still expects Alt+N to open an order.
      if (isOverlayOpen()) return;
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
      // Naming an order is a double-click or a long press, neither of which a keyboard can
      // produce, so Alt+R is the keyboard's way into the same dialog.
      if (event.code === 'KeyR') {
        const active = carts.find((cart) => cart.id === activeCartId);
        if (active) {
          event.preventDefault();
          requestRename(active);
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

    // Capture, for the reason given in `catalog-search.tsx`.
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
    // Re-bound whenever the open orders change so the handler never switches to a closed one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carts, activeCartId]);

  return (
    <View className="h-12 flex-row items-center border-b border-border bg-surface-muted">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          scrollOffset.current = event.nativeEvent.contentOffset.x;
        }}
        onLayout={(event) => {
          viewportWidth.current = event.nativeEvent.layout.width;
          revealTab(activeCartId);
        }}
        className="flex-1"
        contentContainerStyle={{ alignItems: 'center', paddingHorizontal: STRIP_PADDING, gap: 8 }}
      >
        {carts.map((cart) => (
          <OrderTab
            key={cart.id}
            cart={cart}
            products={products}
            active={cart.id === activeCartId}
            onSwitch={() => switchCart(cart.id)}
            onClose={() => requestClose(cart)}
            onRename={() => requestRename(cart)}
            onMeasure={(layout) => {
              tabLayouts.current[cart.id] = layout;
              // A tab opened by `Alt+N` is measured after the effect above has run, so the
              // order that was just created reveals itself here.
              if (cart.id === activeCartId) revealTab(cart.id);
            }}
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

      <Dialog
        open={renameId !== undefined}
        onOpenChange={(next) => {
          if (!next) setRenameId(undefined);
        }}
      >
        <DialogContent>
          <DialogTitle>{t('pos.order.rename')}</DialogTitle>
          <View className="gap-2 py-2">
            <Text variant="caption" className="text-muted-foreground">
              {renameCart ? orderLabel(t, renameCart.ordinal) : ''}
            </Text>
            <Field label={t('pos.order.renameField')}>
              <Input
                value={renameDraft}
                onChangeText={setRenameDraft}
                placeholder={t('pos.order.renamePlaceholder')}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => applyRename(renameDraft)}
              />
            </Field>
          </View>
          <DialogFooter>
            {renameCart?.label ? (
              <Button variant="outline" onPress={() => applyRename('')}>
                <SecondaryButtonLabel>{t('pos.order.renameClear')}</SecondaryButtonLabel>
              </Button>
            ) : (
              <DialogClose variant="outline">
                <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
              </DialogClose>
            )}
            <Button onPress={() => applyRename(renameDraft)}>
              <ButtonLabel>{t('pos.order.renameSave')}</ButtonLabel>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={pendingCloseId !== undefined} onOpenChange={() => setPendingCloseId(undefined)}>
        <AlertDialogContent>
          <AlertDialogTitle>
            {pendingCart ? `${t('pos.order.closePrefix')} ${cartLabel(t, pendingCart)}?` : ''}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {pendingCart
              ? `${cartLabel(t, pendingCart)} · ${countLabel(
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
  /** Double press on web, long press on native: both open the naming dialog. */
  onRename: () => void;
  /** Where this tab sits inside the scroller, so the strip can bring it into view. */
  onMeasure: (layout: { x: number; width: number }) => void;
}

function OrderTab({ cart, products, active, onSwitch, onClose, onRename, onMeasure }: OrderTabProps) {
  const t = useT();
  const label = cartLabel(t, cart);
  const lineCount = cartLineCount(cart);
  const total = cartTotalsOf(cart, products).total;
  const lastPressAt = useRef(0);

  /**
   * The second of two quick presses names the order instead of switching to it. Timing the
   * presses rather than binding `onDoubleClick` keeps one code path for web and native:
   * React Native's `Pressable` has no double-press event on either platform.
   */
  function handlePress() {
    const now = Date.now();
    if (now - lastPressAt.current < DOUBLE_PRESS_MS) {
      lastPressAt.current = 0;
      onRename();
      return;
    }
    lastPressAt.current = now;
    onSwitch();
  }

  return (
    <View
      onLayout={(event) => onMeasure({ x: event.nativeEvent.layout.x, width: event.nativeEvent.layout.width })}
      className={`h-9 flex-row items-center rounded-md ${
        active ? 'border border-border-strong bg-surface' : ''
      }`}
    >
      <Pressable
        onPress={handlePress}
        onLongPress={onRename}
        delayLongPress={450}
        accessibilityRole="button"
        accessibilityLabel={`${t('pos.order.switchTo')} ${label}`}
        accessibilityHint={t('pos.order.renameHint')}
        accessibilityState={{ selected: active }}
        className="h-9 flex-row items-center gap-2 px-3"
      >
        {active ? <View className="h-4 w-[3px] rounded-full bg-primary" /> : null}
        <Text
          variant="label"
          className={`font-semibold ${active ? 'text-foreground' : 'text-muted-foreground'}`}
        >
          {label}
        </Text>
        {lineCount === 0 ? (
          <Text variant="caption" className="text-subtle-foreground">{t('pos.order.empty')}</Text>
        ) : (
          <>
            <View className="min-w-5 items-center rounded-full bg-muted px-1.5 py-0.5">
              <Text variant="caption" className="font-semibold tabular-nums text-foreground">{lineCount}</Text>
            </View>
            <Text
              variant="label"
              className={`font-bold tabular-nums ${
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
