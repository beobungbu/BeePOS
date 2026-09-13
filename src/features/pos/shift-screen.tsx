import { useState } from 'react';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
  Badge,
  Button,
  ButtonLabel,
  Field,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { drawerAfterMovement, shiftSummary } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';
import {
  useCashMovementNotes,
  useCashMovements,
  useShiftCashMovements,
} from '../../data/cash-movement-store';
import { useOrderStore } from '../../data/order-store';
import { useOrgStore } from '../../data/org-store';
import { useCan, useSessionStore } from '../../data/session-store';
import { useCurrentShift, useShiftHistory, useShiftStore } from '../../data/shift-store';
import { CashMovementDialog } from './components/cash-movement-dialog';
import { SecondaryButtonLabel } from './components/secondary-button-label';
import { usePosLayout } from './hooks/use-pos-layout';
import { formatDateTime, formatTime } from '../../lib/datetime';

/** Placeholder for a value a shift does not have yet; never an em dash, per the copy rules. */
const NO_VALUE = '-';

export default function ShiftScreen() {
  const t = useT();
  const toast = useToast();
  const layout = usePosLayout();
  const canRecordCash = useCan('cash.movement');
  const store = useSessionStore((state) => state.store);
  const staffList = useOrgStore((state) => state.staff);
  const orders = useOrderStore((state) => state.orders);
  const movements = useCashMovements();
  const notes = useCashMovementNotes();
  const currentShift = useCurrentShift();
  const shiftMovements = useShiftCashMovements(currentShift?.id);
  const history = useShiftHistory(store?.id);
  const openShift = useShiftStore((state) => state.openShift);
  const closeShift = useShiftStore((state) => state.closeShift);

  const [openingCashText, setOpeningCashText] = useState('');
  const [countedCashText, setCountedCashText] = useState('');
  const [cashDialogOpen, setCashDialogOpen] = useState(false);

  const summary = currentShift ? shiftSummary(currentShift, orders, movements) : undefined;
  const isTable = layout.breakpoint !== 'phone';
  const isPhone = layout.breakpoint === 'phone';

  useScreenHeader({
    title: t('pos.shift.title'),
    subtitle: currentShift ? t('pos.shift.statusOpen') : t('pos.shift.noOpenShift'),
    backTo: '/pos',
  });

  function staffName(staffId: string): string {
    return staffList.find((member) => member.id === staffId)?.name ?? staffId;
  }

  function handleOpenShift() {
    const openingCash = Number.parseFloat(openingCashText) || 0;
    const shift = openShift(openingCash);
    setOpeningCashText('');
    recordAudit({
      action: 'shiftOpen',
      entity: 'shift',
      entityId: shift.id,
      summary: `${t('pos.shift.openingCash')} ${formatVND(openingCash)}`,
    });
    toast.show({ title: t('pos.shift.openedToast'), variant: 'success' });
  }

  function handleCloseShift() {
    if (!currentShift || !summary) return;
    const countedCash = Number.parseFloat(countedCashText) || 0;
    closeShift(currentShift.id, countedCash);
    setCountedCashText('');
    recordAudit({
      action: 'shiftClose',
      entity: 'shift',
      entityId: currentShift.id,
      summary: `${t('chain.zreport.sheet.counted')} ${formatVND(countedCash)}, ${t(
        'chain.zreport.sheet.variance',
      )} ${formatVND(countedCash - summary.expectedCash)}`,
    });
    toast.show({ title: t('pos.shift.closedToast'), variant: 'success' });
  }

  /** Phone pushes the route, desktop opens the dialog; one form behind both. */
  function handleCashAction() {
    if (isPhone) {
      router.push('/pos/shift/cash');
      return;
    }
    setCashDialogOpen(true);
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 16 }}
      >
        {currentShift && summary ? (
          <>
            {/* Cash in and cash out are their own figures rather than one net line: a till
                that took 2.000.000 in and paid 5.230.000 out is not the same story as one
                that paid 3.230.000 out, and only the two numbers tell them apart. */}
            <View className="flex-row flex-wrap gap-3">
              <ShiftStat label={t('chain.cash.stat.opening')} value={formatVND(currentShift.openingCash)} />
              <ShiftStat label={t('chain.cash.stat.cashSales')} value={formatVND(summary.cashRevenue)} />
              {/* A sign only where there is something to sign: "-0 đ" reads as a defect. */}
              <ShiftStat
                label={t('chain.cash.stat.cashIn')}
                value={summary.cashIn > 0 ? `+${formatVND(summary.cashIn)}` : formatVND(0)}
                tone={summary.cashIn > 0 ? 'text-success' : 'text-foreground'}
              />
              <ShiftStat
                label={t('chain.cash.stat.cashOut')}
                value={summary.cashOut > 0 ? `-${formatVND(summary.cashOut)}` : formatVND(0)}
                tone={summary.cashOut > 0 ? 'text-destructive' : 'text-foreground'}
              />
              <ShiftStat label={t('chain.cash.stat.expected')} value={formatVND(summary.expectedCash)} />
            </View>

            <View className="flex-row flex-wrap items-center gap-2">
              <Text variant="label" className="grow font-normal text-muted-foreground">
                {fill(t('chain.cash.countLabel'), { count: shiftMovements.length })}
              </Text>
              {canRecordCash ? (
                <Button variant="outline" onPress={handleCashAction}>
                  <SecondaryButtonLabel>{t('chain.cash.action')}</SecondaryButtonLabel>
                </Button>
              ) : null}
              <Button variant="outline" onPress={() => router.push('/pos/shift/z')}>
                <SecondaryButtonLabel>{t('chain.zreport.action')}</SecondaryButtonLabel>
              </Button>
            </View>

            {shiftMovements.length === 0 ? (
              <Text variant="label" className="font-normal text-muted-foreground">
                {t('chain.cash.listEmpty')}
              </Text>
            ) : (
              <View className="overflow-hidden rounded-lg border border-border bg-surface">
                <Table layout={isTable ? 'scroll' : 'stacked'}>
                  <TableHeader>
                    <TableRow>
                      <TableHead label={t('chain.cash.columns.time')}>{t('chain.cash.columns.time')}</TableHead>
                      <TableHead label={t('chain.cash.columns.type')}>{t('chain.cash.columns.type')}</TableHead>
                      <TableHead label={t('chain.cash.columns.reason')}>{t('chain.cash.columns.reason')}</TableHead>
                      <TableHead label={t('chain.cash.columns.staff')}>{t('chain.cash.columns.staff')}</TableHead>
                      <TableHead label={t('chain.cash.columns.amount')}>{t('chain.cash.columns.amount')}</TableHead>
                      <TableHead label={t('chain.cash.columns.drawerAfter')}>
                        {t('chain.cash.columns.drawerAfter')}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shiftMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell label={t('chain.cash.columns.time')}>
                          <Text variant="label" numeric="tabular" className="font-normal">
                            {formatTime(new Date(movement.createdAt).toISOString())}
                          </Text>
                        </TableCell>
                        <TableCell label={t('chain.cash.columns.type')}>
                          <Badge variant={movement.type === 'in' ? 'success' : 'warning'}>
                            {t(`chain.cash.reasons.${movement.reason}`)}
                          </Badge>
                        </TableCell>
                        <TableCell label={t('chain.cash.columns.reason')}>
                          <Text variant="label" className="font-normal" numberOfLines={2}>
                            {notes[movement.id] ?? NO_VALUE}
                          </Text>
                        </TableCell>
                        <TableCell label={t('chain.cash.columns.staff')}>
                          <Text variant="label" tone="muted" className="font-normal">
                            {staffName(movement.staffId)}
                          </Text>
                        </TableCell>
                        <TableCell label={t('chain.cash.columns.amount')}>
                          <Text
                            variant="label"
                            numeric="tabular"
                            className={`w-full text-right font-semibold ${
                              movement.type === 'in' ? 'text-success' : 'text-destructive'
                            }`}
                          >
                            {`${movement.type === 'in' ? '+' : '-'}${formatVND(movement.amount)}`}
                          </Text>
                        </TableCell>
                        <TableCell label={t('chain.cash.columns.drawerAfter')}>
                          <Text variant="label" numeric="tabular" className="w-full text-right font-normal">
                            {formatVND(drawerAfterMovement(currentShift, orders, movements, movement.id))}
                          </Text>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </View>
            )}

            <View className="w-full max-w-[480px] gap-4 rounded-lg border border-border bg-surface p-4">
              <Text variant="heading" className="font-semibold text-foreground">{t('pos.shift.closeTitle')}</Text>
              <Field label={t('pos.shift.countedCash')}>
                <Input
                  value={countedCashText}
                  onChangeText={setCountedCashText}
                  keyboardType="numeric"
                  placeholder="0"
                  className="text-right tabular-nums"
                />
              </Field>
              <AlertDialog>
                <AlertDialogTrigger className="min-h-[52px]">
                  <ButtonLabel>{t('pos.shift.closeAction')}</ButtonLabel>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogTitle>{t('pos.shift.closeConfirmTitle')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('pos.shift.closeConfirmDescription')}</AlertDialogDescription>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      <SecondaryButtonLabel>{t('common.actions.cancel')}</SecondaryButtonLabel>
                    </AlertDialogCancel>
                    <AlertDialogAction onPress={handleCloseShift}>
                      <ButtonLabel>{t('pos.shift.closeAction')}</ButtonLabel>
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </View>
          </>
        ) : (
          <View className="w-full max-w-[480px] gap-4 rounded-lg border border-border bg-surface p-4">
            <Text variant="heading" className="font-semibold text-foreground">{t('pos.shift.openTitle')}</Text>
            <Text variant="label" className="font-normal text-muted-foreground">{t('pos.shift.noOpenShift')}</Text>
            <Field label={t('pos.shift.openingCash')}>
              <Input
                value={openingCashText}
                onChangeText={setOpeningCashText}
                keyboardType="numeric"
                placeholder="0"
                className="text-right tabular-nums"
              />
            </Field>
            <Button className="min-h-[52px]" onPress={handleOpenShift}>
              <ButtonLabel>{t('pos.shift.openAction')}</ButtonLabel>
            </Button>
          </View>
        )}

        <Text variant="heading" className="font-semibold text-foreground">{t('pos.shift.history')}</Text>

        {isTable ? (
          <View className="overflow-hidden rounded-lg border border-border bg-surface">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('pos.shift.openedAt')}</TableHead>
                  <TableHead>{t('pos.shift.closedAt')}</TableHead>
                  <TableHead>{t('pos.shift.revenue')}</TableHead>
                  <TableHead>{t('pos.shift.variance')}</TableHead>
                  <TableHead>{t('pos.shift.status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((shift) => {
                  const shiftStat = shiftSummary(shift, orders, movements);
                  return (
                    <TableRow key={shift.id}>
                      <TableCell>{formatDateTime(shift.openedAt)}</TableCell>
                      <TableCell>
                        {shift.closedAt ? formatDateTime(shift.closedAt) : NO_VALUE}
                      </TableCell>
                      <TableCell>{formatVND(shiftStat.revenue)}</TableCell>
                      <TableCell>
                        {shiftStat.variance != null ? formatVND(shiftStat.variance) : NO_VALUE}
                      </TableCell>
                      <TableCell>
                        <Badge variant={shift.closedAt ? 'secondary' : 'success'}>
                          {shift.closedAt ? t('pos.shift.statusClosed') : t('pos.shift.statusOpen')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </View>
        ) : (
          <View className="overflow-hidden rounded-lg border border-border bg-surface">
            {history.map((shift) => {
              const shiftStat = shiftSummary(shift, orders, movements);
              return (
                <View key={shift.id} className="gap-1 border-b border-border p-3">
                  <View className="flex-row items-center justify-between">
                    <Text variant="label" className="font-semibold text-foreground">
                      {formatDateTime(shift.openedAt)}
                    </Text>
                    <Text variant="label" className="font-bold tabular-nums text-foreground">
                      {formatVND(shiftStat.revenue)}
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text variant="caption" className="text-muted-foreground">
                      {`${t('pos.shift.variance')}: ${
                        shiftStat.variance != null ? formatVND(shiftStat.variance) : NO_VALUE
                      }`}
                    </Text>
                    <Badge variant={shift.closedAt ? 'secondary' : 'success'}>
                      {shift.closedAt ? t('pos.shift.statusClosed') : t('pos.shift.statusOpen')}
                    </Badge>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CashMovementDialog
        open={cashDialogOpen}
        onOpenChange={setCashDialogOpen}
        shiftId={currentShift?.id}
        expectedCash={summary?.expectedCash ?? 0}
      />
    </View>
  );
}

function ShiftStat({ label, value, tone = 'text-foreground' }: { label: string; value: string; tone?: string }) {
  return (
    <View className="min-w-[140px] flex-1 gap-1 rounded-lg border border-border bg-surface p-4">
      <Text variant="caption" className="text-muted-foreground">{label}</Text>
      <Text variant="title" className={`font-bold tabular-nums ${tone}`}>{value}</Text>
    </View>
  );
}
