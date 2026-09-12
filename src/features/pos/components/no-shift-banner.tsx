import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';

interface NoShiftBannerProps {
  /** Page gutter of the current band, so the strip lines up with the catalog below it. */
  gutter: number;
  /** The longer sentence only fits from tablet up. */
  verbose: boolean;
}

/**
 * Shift-not-open notice: a 40 pt full bleed strip directly under the order tab strip, never
 * an `AlertBanner` block above the product grid (`docs/design/design-direction.md` section 5,
 * alert banner rules). Selling stays allowed; the strip only says the shift totals are not
 * being recorded.
 */
export function NoShiftBanner({ gutter, verbose }: NoShiftBannerProps) {
  const t = useT();
  const router = useRouter();

  return (
    <View
      className="h-10 flex-row items-center gap-2 border-b border-border bg-warning/12"
      style={{ paddingHorizontal: gutter }}
    >
      <AppIcon name="triangle-alert" size={16} tone="warning" />
      <Text variant="caption" className="flex-1 font-medium text-warning" numberOfLines={1}>
        {verbose ? `${t('pos.shiftBanner.title')}. ${t('pos.shiftBanner.description')}` : t('pos.shiftBanner.title')}
      </Text>
      <Pressable
        onPress={() => router.push('/pos/shift')}
        accessibilityRole="button"
        accessibilityLabel={t('pos.shiftBanner.action')}
        className="h-10 justify-center px-1"
      >
        <Text variant="label" className="font-semibold text-warning">{t('pos.shiftBanner.action')}</Text>
      </Pressable>
    </View>
  );
}
