import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';
import { AppIcon, type AppIconName } from '../../../components/icons';
import type { PaymentMethod } from '../../../domain/types';
import { useT } from '../../../i18n';

const METHODS: PaymentMethod[] = ['cash', 'transfer', 'card', 'points'];

/**
 * On account is not a `PaymentMethod`: nothing is tendered, so the order records no payment
 * and what the buyer owes lives in the receivables ledger. It is a choice on this control and
 * nowhere else, which is why it has its own literal rather than a sixth method on the type.
 */
export const ON_ACCOUNT = 'account';
export type PaymentChoice = PaymentMethod | typeof ON_ACCOUNT;

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
  value: PaymentChoice;
  onChange: (method: PaymentChoice) => void;
  /** Phone rows are 56 pt, everything wider is 64. */
  compact: boolean;
  /** Offers "Ghi nợ": a company buyer on a wholesale order with a credit limit left. */
  allowAccount?: boolean;
}

/**
 * 2 x 2 card grid at every breakpoint. `SegmentedControl` was built first and rejected:
 * "Chuyển khoản" wraps at 375 pt and breaks the control height
 * (`docs/design/design-direction.md` section 5, payment).
 */
export function PaymentMethodCards({
  value,
  onChange,
  compact,
  allowAccount = false,
}: PaymentMethodCardsProps) {
  const t = useT();
  const choices: PaymentChoice[] = allowAccount ? [...METHODS, ON_ACCOUNT] : METHODS;

  return (
    <View className="flex-row flex-wrap gap-2">
      {choices.map((method) => {
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
            <AppIcon
              name={method === ON_ACCOUNT ? 'receipt-text' : METHOD_ICON[method]}
              size={24}
              tone={selected ? 'foreground' : 'muted-foreground'}
            />
            <Text
              variant="label"
              className={`font-normal ${selected ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
              numberOfLines={1}
            >
              {method === ON_ACCOUNT
                ? t('pos.wholesale.account.method')
                : t(METHOD_LABEL_KEY[method])}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export { METHOD_ICON, METHOD_LABEL_KEY };
