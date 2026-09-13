import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Badge,
  Button,
  Checkbox,
  Chip,
  ChipGroup,
  EmptyState,
  IconButton,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppIcon } from '../../components/icons';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useCatalogStore } from '../../data/catalog-store';
import { currentCost } from '../../data/costing-store';
import { useCustomerStore } from '../../data/customer-store';
import { useInventoryStore } from '../../data/inventory-store';
import { useLedgerStore } from '../../data/ledger-store';
import { useOrderStore } from '../../data/order-store';
import { currentOrgId } from '../../data/org-store';
import { returnsForOrder, useReturnsStore } from '../../data/returns-store';
import { useSessionStore } from '../../data/session-store';
import { useStorePriceIndex } from '../../data/store-price-store';
import { formatVND } from '../../domain/money';
import { nextOrderCode } from '../../domain/pos';
import type { Order, OrderLine, ReturnDisposition, ReturnRecord } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { formatDateTime } from '../../lib/datetime';
import { fill } from '../orders/lib/fill';
import { ProductPicker } from '../inventory/product-picker';
import {
  clampQty,
  draftLinesFor,
  exchangePriceFor,
  findOrderByCode,
  RETURN_REASONS,
  settlesOnAccount,
  summarize,
  type ExchangeDraftLine,
  type ReturnDraftLine,
  type ReturnReason,
} from './lib/return-draft';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/** Minted outside the component: a clock read during render is not idempotent. */
function makeId(prefix: string): string {
  return `${prefix}-${Date.now()}`;
}

export interface ReturnScreenProps {
  /**
   * The order the screen should open on, from `/pos/returns?order=<code>`: the hand-over from
   * an order's "Trả / đổi hàng" action. The route remounts this screen on a change of code
   * (see `app/(app)/pos/returns.tsx`), so the draft below is built once, from the initial
   * state, and a cashier's own search is never overwritten by a stale link.
   */
  orderCode?: string;
}

export function ReturnScreen({ orderCode }: ReturnScreenProps) {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';
  const isDesktop = breakpoint === 'desktop';

  const products = useCatalogStore((state) => state.products);
  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const orders = useOrderStore((state) => state.orders);
  const addOrder = useOrderStore((state) => state.addOrder);
  const customers = useCustomerStore((state) => state.customers);
  const returns = useReturnsStore((state) => state.returns);
  const recordReturn = useReturnsStore((state) => state.recordReturn);
  const adjustStock = useInventoryStore((state) => state.adjustStock);
  const staff = useSessionStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);
  const storePrices = useStorePriceIndex();

  // The deep-linked order, resolved once at mount. Lazy initialisers rather than an effect:
  // the screen has to open already showing this order's lines, and an effect would paint an
  // empty search box first and then replace it.
  const linked = orderCode ? findOrderByCode(orders, orderCode) : undefined;
  const [query, setQuery] = useState(orderCode ?? '');
  const [orderId, setOrderId] = useState<string | null>(linked?.id ?? null);
  const [draft, setDraft] = useState<ReturnDraftLine[]>(() =>
    linked ? draftLinesFor(linked, returnsForOrder(returns, linked.id)) : [],
  );
  const [exchangeLines, setExchangeLines] = useState<ExchangeDraftLine[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [notFound, setNotFound] = useState(Boolean(orderCode) && !linked);

  const order = orderId ? orders.find((entry) => entry.id === orderId) : undefined;
  const priorReturns = useMemo(
    () => (order ? returnsForOrder(returns, order.id) : []),
    [returns, order],
  );
  const customer = order?.customerId
    ? customers.find((entry) => entry.id === order.customerId)
    : undefined;
  const onAccount = order ? settlesOnAccount(order, customer) : false;

  const summary = useMemo(
    () => (order ? summarize(order, priorReturns, draft, exchangeLines) : null),
    [order, priorReturns, draft, exchangeLines],
  );

  useScreenHeader({
    title: t('returns.title'),
    subtitle: order ? `${order.code} · ${formatDateTime(order.createdAt)}` : undefined,
    backTo: '/pos',
  });

  function selectOrder(found: Order) {
    setOrderId(found.id);
    setDraft(draftLinesFor(found, returnsForOrder(returns, found.id)));
    setExchangeLines([]);
  }

  function handleFind() {
    const found = findOrderByCode(orders, query);
    setNotFound(!found);
    if (!found) return;
    selectOrder(found);
  }

  function handleClear() {
    setOrderId(null);
    setDraft([]);
    setExchangeLines([]);
    setQuery('');
    setNotFound(false);
  }

  function updateDraft(productId: string, patch: Partial<ReturnDraftLine>) {
    setDraft((prev) => prev.map((line) => (line.productId === productId ? { ...line, ...patch } : line)));
  }

  /**
   * Writes the whole transaction. The order matters: the return record and its write-offs are
   * booked first, then stock moves for the lines that go back on the shelf (damaged lines
   * deliberately move nothing), then the replacement order, then the money.
   */
  function handleComplete() {
    if (!order || !summary?.ready || !store) return;

    const record: ReturnRecord = {
      id: makeId('return'),
      orgId: currentOrgId(),
      storeId: order.storeId,
      orderId: order.id,
      lines: summary.plan.lines,
      refundAmount: summary.plan.refundAmount,
      staffId: staff?.id ?? '',
      createdAt: new Date(),
    };

    let exchangeOrder: Order | undefined;
    if (exchangeLines.length > 0) {
      const lines: OrderLine[] = exchangeLines.map((line) => ({
        productId: line.productId,
        qty: line.qty,
        unitPrice: line.unitPrice,
        unitCostSnapshot: currentCost(line.productId, order.storeId)
          ?? productById.get(line.productId)?.costPrice
          ?? 0,
        priceSource: 'list',
      }));
      const total = summary.exchange.replacementValue;
      exchangeOrder = {
        id: makeId('order-exchange'),
        orgId: record.orgId,
        code: nextOrderCode(
          store.code,
          new Date(),
          orders.filter((entry) => entry.storeId === order.storeId).map((entry) => entry.code),
        ),
        storeId: order.storeId,
        cashierId: staff?.id ?? '',
        customerId: order.customerId,
        lines,
        subtotal: total,
        discountTotal: 0,
        taxTotal: 0,
        total,
        // The customer only ever hands over the difference, so that is what the replacement
        // order is recorded as having collected.
        payments: summary.exchange.amountDue > 0 ? [{ method: 'cash', amount: summary.exchange.amountDue }] : [],
        status: 'completed',
        createdAt: new Date().toISOString(),
        channel: order.channel,
      };
      record.exchangeOrderId = exchangeOrder.id;
    }

    // A company customer who bought on account is owed a smaller balance, not the contents of
    // the drawer. The note is raised before the record is stored so its id can be stamped onto
    // the record itself; `createCreditNote` reads the record and touches no other state.
    //
    // The amount is the net still owed after the replacement goods are counted, not the value
    // of what came back: on an exchange the buyer has already taken stock away in part payment,
    // and crediting the gross would give them that stock for nothing.
    if (onAccount && summary.exchange.refundDue > 0 && order.customerId) {
      // A positive amount is the store's only refusal condition, and the guard above is it,
      // so there is no failure branch to write here.
      const entry = useLedgerStore
        .getState()
        .createCreditNote(order.customerId, record, summary.exchange.refundDue);
      record.creditNoteId = entry?.id;
    }

    recordReturn(record);

    for (const line of summary.plan.restockLines) {
      adjustStock(line.productId, record.storeId, line.qty, `return:${record.id}`);
    }
    if (exchangeOrder) {
      addOrder(exchangeOrder);
      for (const line of exchangeOrder.lines) {
        adjustStock(line.productId, record.storeId, -line.qty, `exchange:${exchangeOrder.id}`);
      }
    }

    setConfirmOpen(false);
    toast.show({
      title: record.creditNoteId ? t('returns.creditNoteToast') : t('returns.doneToast'),
      variant: 'success',
    });
    handleClear();
  }

  const column = {
    product: t('returns.columns.product'),
    purchased: t('returns.columns.purchased'),
    returnQty: t('returns.columns.returnQty'),
    reason: t('returns.columns.reason'),
    disposition: t('returns.columns.disposition'),
    amount: t('returns.columns.amount'),
  };

  const searchRow = (
    <View className="flex-row flex-wrap items-center gap-2">
      <View className={isWide ? 'w-80' : 'flex-1'}>
        <Input
          accessibilityLabel={t('returns.search.label')}
          value={query}
          onChangeText={(value) => {
            setQuery(value);
            setNotFound(false);
          }}
          placeholder={t('returns.search.placeholder')}
        />
      </View>
      <Button variant="outline" onPress={handleFind} disabled={query.trim().length === 0}>
        {t('returns.search.action')}
      </Button>
      {order && (
        <>
          <Badge variant="success">{fill(t('returns.search.selected'), { code: order.code })}</Badge>
          <Button variant="ghost" onPress={handleClear}>
            {t('returns.search.clear')}
          </Button>
          <Text variant="label" tone="muted">
            {fill(t('returns.search.orderMeta'), {
              total: formatVND(order.total),
              date: formatDateTime(order.createdAt),
            })}
          </Text>
        </>
      )}
    </View>
  );

  /**
   * The return lines.
   *
   * Six columns do not fit a phone: "Xử lý" sat at x 387-443 on a 402 pt screen, the
   * horizontal scroll reported a single page, and the disposition control could not be reached
   * at all (P7-07). Under 768 the reason and the disposition move under the product name, in
   * the same cell, which leaves three columns that do fit: what is being returned, how many,
   * and for how much.
   *
   * Still a `Table` rather than a `ListGroup` or `layout="stacked"`: both of those drop the
   * row semantics. `layout="stacked"` was tried first and, measured on web, a line's quantity
   * field is then no longer inside a row element at all, so anything that reads a line as a
   * row (a screen reader, or the end-to-end suite) loses it. Filed in
   * `docs/beeui-audit/findings-31-native-fix.md`. A return line is a row of a document the
   * cashier reads across, and it stays one.
   */
  const linesTable = order && (
    <Table layout="scroll">
      <TableHeader>
        <TableRow>
          <TableHead label={column.product}>{column.product}</TableHead>
          {isWide ? <TableHead label={column.purchased}>{column.purchased}</TableHead> : null}
          <TableHead label={column.returnQty}>{column.returnQty}</TableHead>
          {isWide ? <TableHead label={column.reason}>{column.reason}</TableHead> : null}
          {isWide ? <TableHead label={column.disposition}>{column.disposition}</TableHead> : null}
          <TableHead label={column.amount}>{column.amount}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {draft.map((line) => {
          const name = productById.get(line.productId)?.name ?? line.productId;
          const picked = line.qty > 0;

          const reasonPicker = picked ? (
            <ChipGroup
              className="flex-row flex-wrap gap-1"
              selectionMode="single"
              value={line.reason}
              onValueChange={(value) =>
                updateDraft(line.productId, { reason: (value as ReturnReason) || line.reason })
              }
            >
              {RETURN_REASONS.map((reason) => (
                <Chip key={reason} value={reason}>
                  {t(`returns.reason.${reason}`)}
                </Chip>
              ))}
            </ChipGroup>
          ) : (
            <Text variant="label" tone="muted">{t('returns.unselected')}</Text>
          );

          const dispositionPicker = picked ? (
            <SegmentedControl
              value={line.disposition}
              onValueChange={(value) =>
                updateDraft(line.productId, { disposition: value as ReturnDisposition })
              }
            >
              <SegmentedControlItem value="restock">
                {t('returns.disposition.restock')}
              </SegmentedControlItem>
              <SegmentedControlItem value="damaged">
                {t('returns.disposition.damaged')}
              </SegmentedControlItem>
            </SegmentedControl>
          ) : (
            <Text variant="label" tone="muted">{t('returns.unselected')}</Text>
          );

          return (
            // An unpicked row stays on screen at 60 percent rather than disappearing: the
            // cashier has to be able to see the whole original order.
            <TableRow key={line.productId} className={picked ? '' : 'opacity-60'}>
              <TableCell label={column.product}>
                <View className="gap-2">
                  <View className="flex-row items-center gap-2">
                    <Checkbox
                      accessibilityLabel={fill(t('returns.selectLine'), { product: name })}
                      checked={picked}
                      onCheckedChange={(checked) =>
                        updateDraft(line.productId, { qty: checked ? clampQty(line, 1) : 0 })
                      }
                    />
                    <View className="min-w-0 flex-1">
                      <Text variant="label" className="font-semibold">{name}</Text>
                      <Text variant="caption" tone="muted">
                        {line.remainingQty === 0
                          ? t('returns.notReturnable')
                          : fill(t('returns.remaining'), { qty: line.remainingQty })}
                      </Text>
                      {isWide ? null : (
                        <Text variant="caption" tone="muted">
                          {`${column.purchased}: ${line.purchasedQty}`}
                        </Text>
                      )}
                    </View>
                  </View>
                  {isWide ? null : (
                    <View className="gap-2">
                      {reasonPicker}
                      {dispositionPicker}
                    </View>
                  )}
                </View>
              </TableCell>
              {isWide ? (
                <TableCell label={column.purchased}>
                  <Text variant="label" numeric="tabular" className="w-full text-right">{line.purchasedQty}</Text>
                </TableCell>
              ) : null}
              <TableCell label={column.returnQty}>
                <Input
                  accessibilityLabel={fill(t('returns.qtyLabel'), { product: name })}
                  value={String(line.qty)}
                  onChangeText={(value) =>
                    updateDraft(line.productId, { qty: clampQty(line, Number(value) || 0) })
                  }
                  keyboardType="numeric"
                />
              </TableCell>
              {isWide ? <TableCell label={column.reason}>{reasonPicker}</TableCell> : null}
              {isWide ? <TableCell label={column.disposition}>{dispositionPicker}</TableCell> : null}
              <TableCell label={column.amount}>
                <Text variant="label" numeric="tabular" className="w-full text-right font-bold">
                  {formatVND(line.qty * line.unitPrice)}
                </Text>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );

  const dispositionSplit = summary
    ? {
        restock: summary.plan.restockLines.reduce((total, line) => total + line.qty, 0),
        damaged: summary.plan.damagedLines.reduce((total, line) => total + line.qty, 0),
      }
    : { restock: 0, damaged: 0 };

  const actionLabel = (() => {
    if (!summary) return t('returns.action.even');
    if (summary.exchange.refundDue > 0) {
      return fill(t(onAccount ? 'returns.action.creditNote' : 'returns.action.refund'), {
        value: formatVND(summary.exchange.refundDue),
      });
    }
    if (summary.exchange.amountDue > 0) {
      return fill(t('returns.action.charge'), { value: formatVND(summary.exchange.amountDue) });
    }
    return t('returns.action.even');
  })();

  const exchangePane = order && summary && (
    <View className="gap-3 rounded-lg border border-border bg-surface p-4">
      <View className="flex-row items-center justify-between">
        <Text variant="heading">{t('returns.exchange.title')}</Text>
        <Button variant="outline" size="sm" onPress={() => setPickerOpen(true)}>
          {t('returns.exchange.add')}
        </Button>
      </View>

      {exchangeLines.length === 0 ? (
        <Text tone="muted">{t('returns.exchange.empty')}</Text>
      ) : (
        exchangeLines.map((line, index) => {
          const name = productById.get(line.productId)?.name ?? line.productId;
          return (
            <View key={`${line.productId}-${index}`} className="flex-row items-center gap-2">
              <View className="min-w-0 flex-1">
                <Text variant="label" className="font-semibold">{name}</Text>
                <Text variant="caption" tone="muted">{formatVND(line.unitPrice)}</Text>
              </View>
              <View className="w-20">
                <Input
                  accessibilityLabel={`${t('returns.exchange.qty')} ${name}`}
                  value={String(line.qty)}
                  onChangeText={(value) =>
                    setExchangeLines((prev) =>
                      prev.map((entry, i) =>
                        i === index ? { ...entry, qty: Math.max(0, Number(value) || 0) } : entry,
                      ),
                    )
                  }
                  keyboardType="numeric"
                />
              </View>
              <Text variant="label" numeric="tabular" className="font-bold">
                {formatVND(line.qty * line.unitPrice)}
              </Text>
              <IconButton
                accessibilityLabel={`${t('returns.exchange.remove')} ${name}`}
                variant="ghost"
                onPress={() => setExchangeLines((prev) => prev.filter((_, i) => i !== index))}
              >
                <AppIcon name="x" tone="destructive" />
              </IconButton>
            </View>
          );
        })
      )}

      <View className="gap-2 border-t border-border pt-3">
        <View className="flex-row items-center justify-between">
          <Text variant="label" tone="muted">{t('returns.totals.returnValue')}</Text>
          <Text variant="label" numeric="tabular" className="font-semibold text-success">
            {`-${formatVND(summary.exchange.returnValue)}`}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text variant="label" tone="muted">{t('returns.totals.exchangeValue')}</Text>
          <Text variant="label" numeric="tabular">{`+${formatVND(summary.exchange.replacementValue)}`}</Text>
        </View>
        <View className="flex-row items-center justify-between border-t border-border pt-2">
          <Text variant="label" tone="muted">
            {summary.exchange.refundDue > 0
              ? t('returns.totals.refund')
              : summary.exchange.amountDue > 0
                ? t('returns.totals.extraPayment')
                : t('returns.totals.even')}
          </Text>
          <Text
            variant="title"
            numeric="tabular"
            className={summary.exchange.refundDue > 0 ? 'text-success' : 'text-foreground'}
          >
            {formatVND(summary.exchange.refundDue || summary.exchange.amountDue)}
          </Text>
        </View>
      </View>

      <View className="gap-1 rounded-lg bg-surface-muted p-3">
        {dispositionSplit.restock > 0 && (
          <Text variant="caption" tone="muted">
            {fill(t('returns.note.restock'), { qty: dispositionSplit.restock })}
          </Text>
        )}
        {dispositionSplit.damaged > 0 && (
          <Text variant="caption" tone="muted">
            {fill(t('returns.note.damaged'), { qty: dispositionSplit.damaged })}
          </Text>
        )}
        <Text variant="caption" tone="muted">{t('returns.note.creditNote')}</Text>
      </View>

      <Button onPress={() => setConfirmOpen(true)} disabled={!summary.ready}>
        {actionLabel}
      </Button>
    </View>
  );

  return (
    <ScrollView className="flex-1">
      <View className={`flex-1 gap-4 ${GUTTER[breakpoint]}`}>
        <Text variant="caption" tone="muted">{t('returns.subtitle')}</Text>
        {searchRow}

        {notFound && (
          <View className="rounded-lg bg-destructive/10 p-4">
            <Text variant="label" className="text-destructive">{t('returns.search.notFound')}</Text>
          </View>
        )}

        {!order ? (
          <EmptyState title={t('returns.emptyTitle')} description={t('returns.emptyDescription')} />
        ) : (
          <View className={isDesktop ? 'flex-row gap-4' : 'gap-4'}>
            <View className={isDesktop ? 'min-w-0 flex-1 gap-3' : 'gap-3'}>
              <Text variant="heading">{t('returns.linesTitle')}</Text>
              {linesTable}
            </View>
            <View className={isDesktop ? 'w-[420px] flex-none' : ''}>{exchangePane}</View>
          </View>
        )}
      </View>

      <ProductPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        excludeIds={exchangeLines.map((line) => line.productId)}
        onPick={(product) => {
          setExchangeLines((prev) => [
            ...prev,
            { productId: product.id, qty: 1, unitPrice: exchangePriceFor(product, store?.id, storePrices) },
          ]);
          setPickerOpen(false);
        }}
      />

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('returns.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('returns.confirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleComplete}>{actionLabel}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ScrollView>
  );
}
