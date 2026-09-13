import { useEffect, useMemo } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { Button, Text, useToast } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import {
  formatZReportText,
  movementsInShift,
  zReportTotals,
  type ZReportMovementLine,
} from '../../domain/pos';
import { formatVND } from '../../domain/money';
import type { Shift } from '../../domain/types';
import { formatDate, formatDateTime, formatTime } from '../../lib/datetime';
import { goBackOr } from '../../lib/navigation';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { useCashMovementNotes, useCashMovements } from '../../data/cash-movement-store';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import { METHOD_LABEL_KEY } from './components/payment-method-cards';
import { SecondaryButtonLabel } from './components/secondary-button-label';
import { usePosLayout } from './hooks/use-pos-layout';
import { ensurePrintStylesheet, printReceipt, RECEIPT_PRINT_ID, shareReceipt } from './lib/receipt-print';

/** The roll is monospaced; `Text` has no mono variant, so the family is set here. */
const MONO = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/**
 * `/pos/shift/z`: the end of day sheet for one till
 * (`docs/design/mockups/chain-ops.html` section 6).
 *
 * What is on screen is the string that prints and the string that is shared: the block below
 * renders `formatZReportText` verbatim in a monospaced face rather than re-laying the same
 * figures out in views. A second layout would be a second place for a number to be wrong, and
 * the whole point of a Z report is that the paper and the screen agree.
 *
 * It shares the receipt's print stylesheet, so it leaves the browser at the same 58 mm roll
 * width the shop's thermal printer already has loaded.
 */
export default function ZReportScreen() {
  const t = useT();
  const toast = useToast();
  const layout = usePosLayout();
  const isWide = layout.breakpoint !== 'phone';

  const organization = useOrgStore((state) => state.organization);
  const staffList = useOrgStore((state) => state.staff);
  const store = useSessionStore((state) => state.store);
  const register = useSessionStore((state) => state.register);
  const staff = useSessionStore((state) => state.staff);
  const orders = useOrderStore((state) => state.orders);
  const shifts = useOrderStore((state) => state.shifts);
  const refunds = useOrderStore((state) => state.refunds);
  const movements = useCashMovements();
  const notes = useCashMovementNotes();

  /**
   * The shift being closed: the one open on this till, or the last one closed here. A Z report
   * for "no shift" is not a thing a cashier can act on, and reprinting yesterday's is.
   */
  const shift: Shift | undefined = useMemo(() => {
    const mine = shifts.filter(
      (item) => item.storeId === store?.id && (!staff || item.cashierId === staff.id),
    );
    const forStore = mine.length > 0 ? mine : shifts.filter((item) => item.storeId === store?.id);
    return (
      forStore.find((item) => !item.closedAt) ??
      forStore
        .slice()
        .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())[0]
    );
  }, [shifts, store?.id, staff]);

  useEffect(() => {
    ensurePrintStylesheet();
  }, []);

  const dateText = shift ? formatDate(shift.openedAt) : '';

  useScreenHeader({
    title: t('chain.zreport.title'),
    subtitle: shift
      ? fill(t('chain.zreport.subtitle'), { date: dateText, register: register?.name ?? '' })
      : undefined,
    backTo: '/pos/shift',
  });

  const sheet = useMemo(() => {
    if (!shift) return '';
    const totals = zReportTotals({ shift, orders, refunds, movements });
    const shiftMovements = movementsInShift(shift.id, movements);
    const lines: ZReportMovementLine[] = shiftMovements.map((movement) => ({
      timeText: formatTime(new Date(movement.createdAt).toISOString()),
      reason: notes[movement.id] ?? t(`chain.cash.reasons.${movement.reason}`),
      type: movement.type,
      amount: movement.amount,
    }));

    const cashierIds = new Set([shift.cashierId, ...shiftMovements.map((item) => item.staffId)]);
    const cashierNames = [...cashierIds]
      .map((id) => staffList.find((member) => member.id === id)?.name)
      .filter((name): name is string => Boolean(name));

    return formatZReportText({
      orgName: organization?.name ?? '',
      storeName: store ? `${store.code} · ${store.name}` : '',
      storeAddress: store?.address,
      dateText,
      registerName: register?.name ?? '',
      shiftWindowText: shift.closedAt
        ? fill(t('chain.zreport.shiftWindow'), {
            from: formatTime(shift.openedAt),
            to: formatTime(shift.closedAt),
          })
        : fill(t('chain.zreport.shiftOpenWindow'), { from: formatTime(shift.openedAt) }),
      cashierNames,
      totals,
      movements: lines,
      closedByName: staff?.name ?? '',
      printedAtText: formatDateTime(new Date().toISOString()),
      footer: organization?.receiptFooter ?? '',
      labels: {
        title: t('chain.zreport.sheet.title'),
        revenueSection: t('chain.zreport.sheet.revenueSection'),
        orderCount: t('chain.zreport.sheet.orderCount'),
        revenue: t('chain.zreport.sheet.revenue'),
        discount: t('chain.zreport.sheet.discount'),
        refunds: t('chain.zreport.sheet.refunds'),
        netRevenue: t('chain.zreport.sheet.netRevenue'),
        methodSection: t('chain.zreport.sheet.methodSection'),
        methods: {
          cash: t(METHOD_LABEL_KEY.cash),
          transfer: t(METHOD_LABEL_KEY.transfer),
          card: t(METHOD_LABEL_KEY.card),
          points: t(METHOD_LABEL_KEY.points),
        },
        drawerSection: t('chain.zreport.sheet.drawerSection'),
        openingCash: t('chain.zreport.sheet.openingCash'),
        cashSales: t('chain.zreport.sheet.cashSales'),
        cashIn: t('chain.zreport.sheet.cashIn'),
        cashOut: t('chain.zreport.sheet.cashOut'),
        expected: t('chain.zreport.sheet.expected'),
        counted: t('chain.zreport.sheet.counted'),
        variance: t('chain.zreport.sheet.variance'),
        movementSection: t('chain.zreport.sheet.movementSection'),
        noMovements: t('chain.zreport.sheet.noMovements'),
        closedBy: t('chain.zreport.sheet.closedBy'),
        printedAt: t('chain.zreport.sheet.printedAt'),
        notCounted: t('chain.zreport.sheet.notCounted'),
      },
    });
  }, [
    shift,
    orders,
    refunds,
    movements,
    notes,
    organization,
    store,
    register,
    staff,
    staffList,
    dateText,
    t,
  ]);

  const totals = useMemo(
    () => (shift ? zReportTotals({ shift, orders, refunds, movements }) : null),
    [shift, orders, refunds, movements],
  );
  const variance = totals?.variance ?? null;

  /**
   * What the roll says, for a screen reader.
   *
   * The sheet is a monospaced block laid out in columns, so it is one accessibility element:
   * announcing it verbatim reads a wall of dot leaders, and announcing only the title (which
   * is what it did) hides every figure on the report from VoiceOver entirely (P7-08). This is
   * the same set of numbers, in the order the sheet prints them, as sentences.
   */
  const sheetLabel = useMemo(() => {
    if (!totals) return t('chain.zreport.title');
    const s = (key: string) => t(`chain.zreport.sheet.${key}`);
    const lines = [
      `${t('chain.zreport.title')}${dateText ? `, ${dateText}` : ''}`,
      `${s('orderCount')} ${totals.orderCount}`,
      `${s('revenue')} ${formatVND(totals.grossRevenue)}`,
      `${s('discount')} ${formatVND(totals.discountTotal)}`,
      `${s('refunds')} ${formatVND(totals.refundTotal)}`,
      `${s('netRevenue')} ${formatVND(totals.netRevenue)}`,
      ...totals.payments
        .filter((payment) => payment.amount > 0)
        .map((payment) => `${t(METHOD_LABEL_KEY[payment.method])} ${formatVND(payment.amount)}`),
      `${s('openingCash')} ${formatVND(totals.openingCash)}`,
      `${s('cashSales')} ${formatVND(totals.cashRevenue)}`,
      `${s('cashIn')} ${formatVND(totals.cashIn)}`,
      `${s('cashOut')} ${formatVND(totals.cashOut)}`,
      `${s('expected')} ${formatVND(totals.expectedCash)}`,
      `${s('counted')} ${totals.countedCash == null ? s('notCounted') : formatVND(totals.countedCash)}`,
      `${s('variance')} ${variance == null ? s('notCounted') : formatVND(variance)}`,
    ];
    return lines.join('. ');
  }, [totals, variance, dateText, t]);

  function handlePrint() {
    if (printReceipt()) {
      toast.show({ title: t('chain.zreport.printedToast'), variant: 'success' });
      return;
    }
    toast.show({ title: t('chain.zreport.printFailed'), variant: 'destructive' });
  }

  async function handleShare() {
    const outcome = await shareReceipt(sheet, t('chain.zreport.title'));
    if (outcome === 'shared') {
      toast.show({ title: t('chain.zreport.sharedToast'), variant: 'success' });
    } else if (outcome === 'failed') {
      toast.show({ title: t('chain.zreport.shareFailed'), variant: 'destructive' });
    }
  }

  if (!shift) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text variant="body" className="text-center text-muted-foreground">
          {t('chain.zreport.noShift')}
        </Text>
        <Button variant="outline" onPress={() => goBackOr('/pos/shift')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  const varianceTone =
    variance == null || variance === 0 ? 'text-foreground' : variance < 0 ? 'text-destructive' : 'text-warning';
  const varianceNote =
    variance == null
      ? t('chain.zreport.explain.varianceNotCounted')
      : variance < 0
        ? t('chain.zreport.explain.varianceShort')
        : variance > 0
          ? t('chain.zreport.explain.varianceOver')
          : t('chain.zreport.explain.varianceMatch');

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 16, alignItems: 'center' }}
      >
        <View className={isWide ? 'flex-row items-start gap-6' : 'w-full gap-4'}>
          {/* The printed block. The stylesheet in lib/receipt-print.ts hides everything
              outside this node, so what leaves the browser is exactly these 32 columns. */}
          <View
            nativeID={RECEIPT_PRINT_ID}
            className="w-full max-w-[360px] rounded-lg border border-border bg-surface p-4"
          >
            <Text
              variant="caption"
              testID="z-report-sheet"
              accessibilityLabel={sheetLabel}
              style={{ fontFamily: MONO, lineHeight: 18 }}
            >
              {sheet}
            </Text>
          </View>

          <View className={isWide ? 'w-[320px] gap-3' : 'w-full gap-3'}>
            <View className="gap-1.5 rounded-lg border border-border bg-surface p-4">
              <Text variant="label" className="font-semibold text-foreground">
                {t('chain.zreport.explain.varianceTitle')}
              </Text>
              <Text variant="title" numeric="tabular" className={`font-bold ${varianceTone}`}>
                {variance == null ? t('chain.zreport.sheet.notCounted') : formatVND(variance)}
              </Text>
              <Text variant="caption" className="text-muted-foreground">{varianceNote}</Text>
            </View>

            <View className="gap-1.5 rounded-lg border border-border bg-surface p-4">
              <Text variant="label" className="font-semibold text-foreground">
                {t('chain.zreport.explain.title')}
              </Text>
              <Text variant="caption" className="text-muted-foreground">{t('chain.zreport.explain.body1')}</Text>
              <Text variant="caption" className="text-muted-foreground">{t('chain.zreport.explain.body2')}</Text>
            </View>

            {/* One control, because only one of the two is real on a given platform: the
                browser prints and a phone with no printer driver shares the text instead. */}
            {Platform.OS === 'web' ? (
              <Button variant="outline" onPress={handlePrint}>
                <SecondaryButtonLabel>{t('chain.zreport.print')}</SecondaryButtonLabel>
              </Button>
            ) : (
              <Button variant="outline" onPress={handleShare}>
                <SecondaryButtonLabel>{t('chain.zreport.share')}</SecondaryButtonLabel>
              </Button>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
