import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { CreditCheck } from '../../../domain/ledger';
import { useT } from '../../../i18n';
import { formatDate } from '../../../lib/datetime';

interface OnAccountPanelProps {
  check: CreditCheck;
  dueDate: Date | undefined;
  /** The buyer has no credit limit at all, which is a refusal rather than a shortfall. */
  noLimit: boolean;
}

/**
 * What the cashier has to know before putting an order on account: the agreed limit, what is
 * already owed, and what is left **after** this order, plus the date it falls due.
 *
 * The figure the seller is actually deciding on is the last one, so it is the one in
 * `success` weight; a projection that has gone past the limit turns destructive and the pay
 * button is refused by the screen above.
 */
export function OnAccountPanel({ check, dueDate, noLimit }: OnAccountPanelProps) {
  const t = useT();
  const remaining = Math.max(0, check.limit - check.projected);
  const blocked = !check.allowed;

  return (
    <View className="gap-2 rounded-md bg-surface-muted p-4">
      <Row label={t('pos.wholesale.account.limit')} value={formatVND(check.limit)} />
      <Row label={t('pos.wholesale.account.balance')} value={formatVND(check.balance)} />
      <View className="flex-row flex-wrap items-center justify-between gap-x-3">
        <Text variant="label" className="min-w-0 shrink font-normal text-muted-foreground">
          {t('pos.wholesale.account.availableAfter')}
        </Text>
        <Text
          variant="label"
          className={`shrink-0 font-bold tabular-nums ${blocked ? 'text-destructive' : 'text-success'}`}
        >
          {formatVND(remaining)}
        </Text>
      </View>
      {dueDate ? (
        <Row label={t('pos.wholesale.account.dueDate')} value={formatDate(dueDate.toISOString())} />
      ) : null}
      {blocked ? (
        <Text variant="caption" className="font-semibold text-destructive">
          {noLimit
            ? t('pos.wholesale.account.blockedNoLimit')
            : t('pos.wholesale.account.blockedOverLimit')}
        </Text>
      ) : null}
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3">
      <Text variant="label" className="min-w-0 shrink font-normal text-muted-foreground">
        {label}
      </Text>
      <Text variant="label" className="shrink-0 font-normal tabular-nums text-foreground">
        {value}
      </Text>
    </View>
  );
}
