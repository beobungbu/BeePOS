import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, View, type TextInput } from 'react-native';
import { Dialog, DialogContent, DialogTitle, SearchInput, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useCatalogStore } from '../data/catalog-store';
import { useCustomerStore } from '../data/customer-store';
import { useOrderStore } from '../data/order-store';
import { formatVND } from '../domain/money';
import { useT } from '../i18n';
import {
  capPerGroup,
  groupCommands,
  rankCommands,
  type CommandGroup,
  type CommandItem,
} from '../lib/command-search';
import { NAV_ITEMS } from './shell/nav-items';
import { useShellOverlayStore } from './shell/overlay-store';

/** Rows per section, so one group with 200 hits cannot push the other three off screen. */
const ROWS_PER_GROUP = 5;
/** Newest orders offered; older ones are reached from `/orders`, which can filter by date. */
const ORDER_SOURCE_LIMIT = 200;
/** DOM id of the search wrapper, so the field can be focused when the dialog opens (web). */
const SEARCH_WRAPPER_ID = 'command-palette-search';
/**
 * How long to wait before focusing the field. Native needs the longer one: the dialog is a
 * React Native `Modal`, and a `focus()` issued while it is still being presented is dropped
 * (the same race as BeeUI's `autoFocus`, `docs/beeui-audit/findings-20-native-p5.md` 20N-02).
 */
const FOCUS_DELAY_MS = Platform.OS === 'web' ? 50 : 250;

/**
 * `Cmd/Ctrl+K`: one field that reaches every screen, product, order and customer without
 * crossing three menus. Ranking lives in `src/lib/command-search.ts`; this component only
 * turns the ranked list into rows and owns the keyboard.
 *
 * An empty query lists the screens alone. Offering five arbitrary products before a letter is
 * typed reads as a recommendation the app cannot make, while the nine areas are the answer to
 * "where do I go", which is what an empty palette is asking.
 */
export function CommandPalette() {
  const t = useT();
  const open = useShellOverlayStore((state) => state.overlay === 'palette');
  const closeOverlay = useShellOverlayStore((state) => state.closeOverlay);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && closeOverlay()}>
      <DialogContent className="w-full max-w-[560px] gap-3">
        <DialogTitle>{t('common.command.title')}</DialogTitle>
        {/* Mounted only while open, so the query and the selected row are new every time the
            palette is summoned. Resetting them on close instead meant two `setState` calls
            inside an effect, and left yesterday's query in the field for one frame. */}
        {open ? <CommandPaletteBody onClose={closeOverlay} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CommandPaletteBody({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();

  const products = useCatalogStore((state) => state.products);
  const orders = useOrderStore((state) => state.orders);
  const customers = useCustomerStore((state) => state.customers);

  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  // The keyboard handler is installed once per open; a ref keeps it reading the current rows
  // without re-subscribing on every keystroke.
  const rowsRef = useRef<CommandItem[]>([]);
  const activeRef = useRef(0);

  const screenItems = useMemo<CommandItem[]>(
    () =>
      NAV_ITEMS.map((item) => ({
        id: `screen-${item.id}`,
        group: 'screens' as const,
        title: t(item.labelKey),
        href: item.href,
      })),
    [t],
  );

  const searchItems = useMemo<CommandItem[]>(
    () => [
      ...screenItems,
      ...products.map((product) => ({
        id: `product-${product.id}`,
        group: 'products' as const,
        title: product.name,
        subtitle: `${product.sku} · ${formatVND(product.salePrice)}`,
        keywords: `${product.sku} ${product.barcode}`,
        href: `/products/${product.id}`,
      })),
      ...orders.slice(0, ORDER_SOURCE_LIMIT).map((order) => ({
        id: `order-${order.id}`,
        group: 'orders' as const,
        title: order.code,
        subtitle: formatVND(order.total),
        href: `/orders/${order.id}`,
      })),
      ...customers.map((customer) => ({
        id: `customer-${customer.id}`,
        group: 'customers' as const,
        title: customer.name,
        subtitle: customer.phone,
        keywords: customer.phone,
        href: `/customers/${customer.id}`,
      })),
    ],
    [screenItems, products, orders, customers],
  );

  const rows = useMemo(() => {
    if (query.trim().length === 0) return screenItems;
    return capPerGroup(rankCommands(searchItems, query, 60), ROWS_PER_GROUP);
  }, [query, screenItems, searchItems]);

  const sections = useMemo(() => groupCommands(rows), [rows]);
  const clampedIndex = rows.length === 0 ? 0 : Math.min(activeIndex, rows.length - 1);

  // Written after the commit, never during render: the keydown listener below is installed
  // once per opening and only reads these from an event, which is always later.
  useEffect(() => {
    rowsRef.current = rows;
    activeRef.current = clampedIndex;
  });

  // A fresh query starts at the first row: keeping the old index would run the cashier's Enter
  // into whatever happens to sit at that position now.
  function handleQueryChange(next: string) {
    setQuery(next);
    setActiveIndex(0);
  }

  // The palette opens to be typed into, so the field takes focus on both platforms rather
  // than costing a second tap on the tablet, where there is no Cmd+K to open it with.
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      if (Platform.OS === 'web') {
        // On web the field is reached through the wrapper's DOM node, the same way the POS
        // and orders F3 shortcuts reach theirs.
        if (typeof document !== 'undefined') {
          document.getElementById(SEARCH_WRAPPER_ID)?.querySelector('input')?.focus();
        }
        return;
      }
      searchRef.current?.focus();
    }, FOCUS_DELAY_MS);
    return () => clearTimeout(focusTimer);
  }, []);

  const handleSelect = useCallback(
    (item: CommandItem) => {
      onClose();
      // The href is built here from a known route shape, but expo-router types `push` against
      // its generated route union and a `string` does not narrow to it (same cast as
      // `src/lib/navigation.ts`).
      router.push(item.href as never);
    },
    [onClose, router],
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const current = rowsRef.current;
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        if (current.length === 0) return;
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        // Wrapping keeps a long list reachable from either end with one held key.
        setActiveIndex((index) => (index + step + current.length) % current.length);
        return;
      }
      if (event.key === 'Enter') {
        const item = current[activeRef.current];
        if (!item) return;
        event.preventDefault();
        handleSelect(item);
      }
    };

    // Capture: the search field has focus while the palette is open, and an arrow key there
    // would otherwise move the caret instead of the selection.
    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [onClose, handleSelect]);

  const groupLabel = (group: CommandGroup) => t(`common.command.group.${group}`);

  return (
    <>
      <View nativeID={SEARCH_WRAPPER_ID}>
        <SearchInput
          accessibilityLabel={t('common.command.title')}
          defaultValue=""
          ref={searchRef}
          onChangeText={handleQueryChange}
          onSearch={handleQueryChange}
          placeholder={t('common.command.placeholder')}
        />
      </View>

      {rows.length === 0 ? (
        <View className="py-6">
          <Text variant="label" className="text-center font-normal text-muted-foreground">
            {t('common.command.empty')}
          </Text>
        </View>
      ) : (
        <ScrollView className="max-h-80" contentContainerClassName="gap-3 pb-1">
          {sections.map((section) => (
            <View key={section.group} className="gap-1">
              <Text variant="caption" className="px-2 text-muted-foreground">
                {groupLabel(section.group)}
              </Text>
              {section.items.map((item) => {
                const index = rows.indexOf(item);
                const active = index === clampedIndex;
                return (
                  <Pressable
                    accessibilityLabel={item.subtitle ? `${item.title} · ${item.subtitle}` : item.title}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    className={`min-h-11 justify-center rounded-md px-2 py-1.5 active:bg-muted ${active ? 'bg-muted' : ''}`}
                    key={item.id}
                    onPress={() => handleSelect(item)}
                  >
                    <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

      {/* The hint names arrow keys, Enter and Esc, which is the keyboard this component
          installs on web only. On a tablet none of those keys exist and the rows are tapped,
          so the line would be instructions for hardware the cashier does not have. */}
      {Platform.OS === 'web' ? (
        <Text variant="caption" className="text-subtle-foreground">
          {t('common.command.hint')}
        </Text>
      ) : null}
    </>
  );
}
