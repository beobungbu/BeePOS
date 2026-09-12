import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon, type AppIconName } from '../../../components/icons';
import type { PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'card', 'points'];

const METHOD_LABEL_KEY: Record<PaymentMethod, string> = {
  cash: 'pos.checkout.methodCash',
  transfer: 'pos.checkout.methodTransfer',
  card: 'pos.checkout.methodCard',
  points: 'pos.checkout.methodPoints',
};

/**
 * `id-card` stands in for points: the icon set of the direction doc has no loyalty glyph and
 * a POS screen is not the place to grow a second icon family.
 */
const METHOD_ICON: Record<PaymentMethod, AppIconName> = {
  cash: 'banknote',
  transfer: 'qr-code',
  card: 'credit-card',
  points: 'id-card',
};

interface PaymentMethodCardsProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /** Phone rows are 56 pt, everything wider is 64. */
  compact: boolean;
}

/**
 * 2 x 2 card grid at every breakpoint. `SegmentedControl` was built first and rejected:
 * "Chuyển khoản" wraps at 375 pt and breaks the control height
 * (`docs/design/design-direction.md` section 5, payment).
 */
export function PaymentMethodCards({ value, onChange, compact }: PaymentMethodCardsProps) {
  const t = useT();

  return (
    <View className="flex-row flex-wrap gap-2">
      {METHODS.map((method) => {
        const selected = method === value;
        return (
          <Pressable
            key={method}
            onPress={() => onChange(method)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`w-[48%] flex-1 basis-[48%] items-center justify-center gap-1.5 rounded-md ${
              compact ? 'h-14' : 'h-16'
            } ${selected ? 'border-2 border-primary bg-primary/10' : 'border border-border bg-surface'}`}
          >
            <AppIcon name={METHOD_ICON[method]} size={24} tone={selected ? 'foreground' : 'muted-foreground'} />
            <Text
              variant="label"
              className={`font-normal ${selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              numberOfLines={1}
            >
              {t(METHOD_LABEL_KEY[method])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { METHOD_ICON, METHOD_LABEL_KEY };
