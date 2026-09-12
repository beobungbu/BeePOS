import { useState } from 'react';
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
import { shiftSummary } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift, useShiftHistory, useShiftStore } from '../../data/shift-store';
import { SecondaryButtonLabel } from './components/secondary-button-label';
import { usePosLayout } from './hooks/use-pos-layout';
import { formatDateTime } from '../../lib/datetime';

/** Placeholder for a value a shift does not have yet; never an em dash, per the copy rules. */
const NO_VALUE = '-';

export default function ShiftScreen() {
  const t = useT();
  const toast = useToast();
  const layout = usePosLayout();
  const store = useSessionStore((state) => state.store);
  const orders = useOrderStore((state) => state.orders);
  const currentShift = useCurrentShift();
  const history = useShiftHistory(store?.id);
  const openShift = useShiftStore((state) => state.openShift);
  const closeShift = useShiftStore((state) => state.closeShift);

  const [openingCashText, setOpeningCashText] = useState('');
  const [countedCashText, setCountedCashText] = useState('');

  const summary = currentShift ? shiftSummary(currentShift, orders) : undefined;
  const isTable = layout.breakpoint !== 'phone';

  useScreenHeader({
    title: t('pos.shift.title'),
    subtitle: currentShift ? t('pos.shift.statusOpen') : t('pos.shift.noOpenShift'),
    backTo: '/pos',
  });

  function handleOpenShift() {
    const openingCash = Number.parseFloat(openingCashText) || 0;
    openShift(openingCash);
    setOpeningCashText('');
    toast.show({ title: t('pos.shift.openedToast'), variant: 'success' });
  }

  function handleCloseShift() {
    if (!currentShift) return;
    const countedCash = Number.parseFloat(countedCashText) || 0;
    closeShift(currentShift.id, countedCash);
    setCountedCashText('');
    toast.show({ title: t('pos.shift.closedToast'), variant: 'success' });
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 16 }}
      >
        {currentShift && summary ? (
          <>
            <View className="flex-row flex-wrap gap-3">
              <ShiftStat label={t('pos.shift.orders')} value={String(summary.orderCount)} />
              <ShiftStat label={t('pos.shift.revenue')} value={formatVND(summary.revenue)} />
              <ShiftStat label={t('pos.shift.expectedCash')} value={formatVND(summary.expectedCash)} />
            </View>

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
                  const shiftStat = shiftSummary(shift, orders);
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
              const shiftStat = shiftSummary(shift, orders);
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
    </View>
  );
}

function ShiftStat({ label, value }: { label: string; value: string }) {
  return (
    <View className="min-w-[140px] flex-1 gap-1 rounded-lg border border-border bg-surface p-4">
      <Text variant="caption" className="text-muted-foreground">{label}</Text>
      <Text variant="title" className="font-bold tabular-nums text-foreground">{value}</Text>
    </View>
  );
}
