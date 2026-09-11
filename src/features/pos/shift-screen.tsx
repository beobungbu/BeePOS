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
  Stat,
  StatLabel,
  StatValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  useToast,
} from '@beemvp/beeui-ui';
import { shiftSummary } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import { useT } from '../../i18n';
import { useOrderStore } from '../../data/order-store';
import { useSessionStore } from '../../data/session-store';
import { useCurrentShift, useShiftHistory, useShiftStore } from '../../data/shift-store';

export default function ShiftScreen() {
  const t = useT();
  const toast = useToast();
  const store = useSessionStore((state) => state.store);
  const orders = useOrderStore((state) => state.orders);
  const currentShift = useCurrentShift();
  const history = useShiftHistory(store?.id);
  const openShift = useShiftStore((state) => state.openShift);
  const closeShift = useShiftStore((state) => state.closeShift);

  const [openingCashText, setOpeningCashText] = useState('');
  const [countedCashText, setCountedCashText] = useState('');

  const summary = currentShift ? shiftSummary(currentShift, orders) : undefined;

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
    <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Text className="text-xl font-semibold text-foreground">{t('pos.shift.title')}</Text>

      {currentShift && summary ? (
        <>
          <View className="flex-row flex-wrap gap-3">
            <Stat className="flex-1 min-w-[140px]">
              <StatLabel>{t('pos.shift.orders')}</StatLabel>
              <StatValue>{summary.orderCount}</StatValue>
            </Stat>
            <Stat className="flex-1 min-w-[140px]">
              <StatLabel>{t('pos.shift.revenue')}</StatLabel>
              <StatValue>{formatVND(summary.revenue)}</StatValue>
            </Stat>
            <Stat className="flex-1 min-w-[140px]">
              <StatLabel>{t('pos.shift.expectedCash')}</StatLabel>
              <StatValue>{formatVND(summary.expectedCash)}</StatValue>
            </Stat>
          </View>

          <View className="gap-3 rounded-lg border border-border p-4">
            <Text className="text-sm font-medium text-foreground">{t('pos.shift.closeTitle')}</Text>
            <Field label={t('pos.shift.countedCash')}>
              <Input value={countedCashText} onChangeText={setCountedCashText} keyboardType="numeric" placeholder="0" />
            </Field>
            <AlertDialog>
              <AlertDialogTrigger>
                <ButtonLabel>{t('pos.shift.closeAction')}</ButtonLabel>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>{t('pos.shift.closeConfirmTitle')}</AlertDialogTitle>
                <AlertDialogDescription>{t('pos.shift.closeConfirmDescription')}</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>
                    <ButtonLabel>{t('common.actions.cancel')}</ButtonLabel>
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
        <View className="gap-3 rounded-lg border border-border p-4">
          <Text className="text-sm text-muted-foreground">{t('pos.shift.noOpenShift')}</Text>
          <Field label={t('pos.shift.openingCash')}>
            <Input value={openingCashText} onChangeText={setOpeningCashText} keyboardType="numeric" placeholder="0" />
          </Field>
          <Button onPress={handleOpenShift}>
            <ButtonLabel>{t('pos.shift.openAction')}</ButtonLabel>
          </Button>
        </View>
      )}

      <View className="gap-2">
        <Text className="text-sm font-medium text-foreground">{t('pos.shift.history')}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
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
                    <TableCell>{new Date(shift.openedAt).toLocaleString('vi-VN')}</TableCell>
                    <TableCell>{shift.closedAt ? new Date(shift.closedAt).toLocaleString('vi-VN') : '—'}</TableCell>
                    <TableCell>{formatVND(shiftStat.revenue)}</TableCell>
                    <TableCell>{shiftStat.variance != null ? formatVND(shiftStat.variance) : '—'}</TableCell>
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
        </ScrollView>
      </View>
    </ScrollView>
  );
}
