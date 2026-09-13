import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import type { Shift } from '../../../domain/types';
import { useT } from '../../../i18n';
import { formatTime } from '../../../lib/datetime';
import { fill } from '../../orders/lib/fill';

interface ShiftChipProps {
  shift: Shift;
  /** Name of whoever opened it, when that is not the cashier standing at the till. */
  otherCashierName?: string;
  /** Page gutter of the current band, so the strip lines up with the catalog below it. */
  gutter: number;
}

/**
 * The open shift, on the sell screen, as the way back to the shift screen.
 *
 * `/pos/shift` was linked only from `no-shift-banner.tsx`, which is exactly what disappears
 * once a shift exists: cash in and out, the Z report and closing the shift were all
 * unreachable on a phone without a deep link (P7-05). This strip takes the banner's slot and
 * its height, so opening a shift no longer moves the catalogue underneath it.
 *
 * A shift opened by somebody else is named rather than hidden: the register picker offers the
 * till as "Đang mở ca" and this used to answer "Chưa mở ca" about the same station (P7-06).
 */
export function ShiftChip({ shift, otherCashierName, gutter }: ShiftChipProps) {
  const t = useT();
  const router = useRouter();

  const time = formatTime(shift.openedAt);
  const label = otherCashierName
    ? fill(t('pos.shift.chipOther'), { name: otherCashierName, time })
    : fill(t('pos.shift.chipOwn'), { time });

  return (
    <View
      className="h-10 flex-row items-center gap-2 border-b border-border bg-surface"
      style={{ paddingHorizontal: gutter }}
    >
      <AppIcon name="clock" size={16} tone={otherCashierName ? 'warning' : 'success'} />
      <Text
        variant="caption"
        className={`flex-1 font-medium ${otherCashierName ? 'text-warning' : 'text-muted-foreground'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
      <Pressable
        onPress={() => router.push('/pos/shift')}
        accessibilityRole="button"
        accessibilityLabel={t('pos.shift.chipAction')}
        className="h-10 justify-center px-1"
      >
        <Text variant="label" className="font-semibold text-info">{t('pos.shift.title')}</Text>
      </Pressable>
    </View>
  );
}
