import { ScrollView, View } from 'react-native';
import { Button, ButtonLabel, Text } from '@beemvp/beeui-ui';
import { useScreenHeader } from '../../components/shell/screen-header';
import { shiftSummary } from '../../domain/pos';
import { formatVND } from '../../domain/money';
import { formatTime } from '../../lib/datetime';
import { goBackOr } from '../../lib/navigation';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { useCashMovements } from '../../data/cash-movement-store';
import { useOrderStore } from '../../data/order-store';
import { useCan, useSessionStore } from '../../data/session-store';
import { useCurrentShift } from '../../data/shift-store';
import { CashMovementForm, draftAmount } from './components/cash-movement-form';
import { useCashMovementSubmit } from './hooks/use-cash-movement';
import { usePosLayout } from './hooks/use-pos-layout';

/**
 * `/pos/shift/cash`: the phone shape of the cash sheet, a pushed route rather than a `Sheet`
 * (BeeUI's does not present on iOS). Reachable at any width, because a typed URL and a deep
 * link have to land somewhere sensible; the shift screen only pushes it on a phone and opens
 * the dialog on desktop.
 */
export default function CashMovementScreen() {
  const t = useT();
  const layout = usePosLayout();
  const canRecord = useCan('cash.movement');
  const register = useSessionStore((state) => state.register);
  const orders = useOrderStore((state) => state.orders);
  const movements = useCashMovements();
  const currentShift = useCurrentShift();

  const summary = currentShift ? shiftSummary(currentShift, orders, movements) : undefined;
  const expectedCash = summary?.expectedCash ?? 0;

  const { draft, setDraft, error, submit } = useCashMovementSubmit(currentShift?.id, () =>
    goBackOr('/pos/shift'),
  );
  const amount = draftAmount(draft);

  useScreenHeader({
    title: t('chain.cash.title'),
    subtitle: currentShift
      ? fill(t('chain.cash.subtitle'), {
          shift: formatTime(currentShift.openedAt),
          register: register?.name ?? '',
        })
      : t('chain.cash.noShift'),
    backTo: '/pos/shift',
  });

  if (!currentShift || !canRecord) {
    return (
      <View className="flex-1 items-center justify-center gap-4 px-6">
        <Text variant="body" className="text-center text-muted-foreground">
          {currentShift ? t('chain.cash.errorSession') : t('chain.cash.noShift')}
        </Text>
        <Button variant="outline" onPress={() => goBackOr('/pos/shift')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 bg-surface-muted"
        contentContainerStyle={{ padding: layout.gutter, gap: 16 }}
      >
        <View className="w-full max-w-[480px] gap-4 self-center rounded-lg border border-border bg-surface p-4">
          <CashMovementForm
            draft={draft}
            onChange={setDraft}
            expectedCash={expectedCash}
            error={error}
          />
          {/* The amount is on the button, which is the last thing the thumb touches: the
              cashier confirms with a number rather than with a memory of what they typed. */}
          <Button className="min-h-[52px]" onPress={submit}>
            <ButtonLabel>
              {amount > 0
                ? fill(t(draft.type === 'in' ? 'chain.cash.submitIn' : 'chain.cash.submitOut'), {
                    amount: formatVND(amount),
                  })
                : t('chain.cash.submit')}
            </ButtonLabel>
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
