import { View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import type { OrderStatus } from '../../../domain/types';
import { useT } from '../../../i18n';

/** The four steps a wholesale order walks, in order. Terminal states sit outside them. */
export const LIFECYCLE_STEPS: readonly OrderStatus[] = [
  'quote',
  'confirmed',
  'delivering',
  'completed',
];

/**
 * How far along the four steps a status is. `paid` and the refund states come after the last
 * step, so they light every one of them; a cancelled order stops wherever it was.
 */
function reachedIndex(status: OrderStatus): number {
  const index = LIFECYCLE_STEPS.indexOf(status);
  if (index >= 0) return index;
  if (status === 'paid' || status === 'partial_refund' || status === 'refunded') {
    return LIFECYCLE_STEPS.length - 1;
  }
  return -1;
}

/**
 * `Báo giá → Đã xác nhận → Đang giao → Hoàn tất`, drawn inside the toolbar row rather than on
 * a row of its own (`docs/design/specs/commerce.md` section G): desktop density applies to
 * detail screens too.
 *
 * Steps are dots with a word, never a bare colour: the state has to survive a greyscale print
 * and a colour-blind reader.
 */
export function OrderLifecycleStepper({ status }: { status: OrderStatus }) {
  const t = useT();
  const reached = reachedIndex(status);

  return (
    <View className="flex-row flex-wrap items-center gap-2" accessibilityRole="progressbar">
      {LIFECYCLE_STEPS.map((step, index) => {
        const done = index < reached;
        const current = index === reached;
        return (
          <View key={step} className="flex-row items-center gap-2">
            {index > 0 ? (
              <View className={`h-px w-5 ${index <= reached ? 'bg-primary' : 'bg-border-strong'}`} />
            ) : null}
            <View
              className={`h-6 w-6 items-center justify-center rounded-full ${
                done || current ? 'bg-primary' : 'border border-border-strong bg-surface'
              }`}
            >
              <Text
                variant="caption"
                className={`font-bold ${done || current ? 'text-primary-foreground' : 'text-muted-foreground'}`}
              >
                {done ? '✓' : String(index + 1)}
              </Text>
            </View>
            <Text
              variant="label"
              className={`${current ? 'font-semibold' : 'font-normal'} ${
                index <= reached ? 'text-foreground' : 'text-muted-foreground'
              }`}
              numberOfLines={1}
            >
              {t(`orders.status.${step}`)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
