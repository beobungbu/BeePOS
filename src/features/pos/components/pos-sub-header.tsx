import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';
import { goBackOr } from '../../../lib/navigation';

interface PosSubHeaderProps {
  title: string;
  subtitle?: string;
  /** Badges: the order being paid, how many orders stay open. */
  trailing?: ReactNode;
  backTo?: string;
}

/**
 * Screen header for the pushed POS routes (cart, checkout, receipt, shift). The app shell
 * owns the store header above it, so this row carries the back control and what the screen
 * is about, matching the mockup's "Thanh toán · Đơn 1" header without taking the shell over.
 */
export function PosSubHeader({ title, subtitle, trailing, backTo = '/pos' }: PosSubHeaderProps) {
  const t = useT();

  return (
    <View className="h-14 flex-row items-center gap-2 border-b border-border bg-surface px-2 pr-4">
      <Pressable
        onPress={() => goBackOr(backTo)}
        accessibilityRole="button"
        accessibilityLabel={t('common.actions.back')}
        className="h-11 w-11 items-center justify-center rounded-full active:bg-muted"
      >
        <AppIcon name="chevron-left" />
      </Pressable>
      <View className="min-w-0 flex-1">
        <Text className="text-body font-semibold text-foreground" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-caption text-muted-foreground" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}
