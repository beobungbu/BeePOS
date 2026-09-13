import { Pressable, View } from 'react-native';
import { Text } from '@beemvp/beeui-ui';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const;

export const PIN_LENGTH = 4;

/**
 * Four filled or hollow dots. A cashier at a counter reads progress from across the till, and
 * the digits themselves must not be readable over their shoulder.
 */
export function PinDots({ length, invalid }: { length: number; invalid?: boolean }) {
  return (
    <View className="flex-row items-center justify-center gap-4">
      {Array.from({ length: PIN_LENGTH }).map((_, index) => (
        <View
          key={index}
          className={`h-3.5 w-3.5 rounded-full ${
            index < length ? (invalid ? 'bg-destructive' : 'bg-primary') : 'bg-muted'
          }`}
        />
      ))}
    </View>
  );
}

/**
 * On-screen number pad, 72 pt keys per the mockup. The lock screen cannot rely on a keyboard:
 * the till may be a tablet on a counter, and on a phone the software keyboard would cover the
 * dots it is filling.
 *
 * The bottom-left slot is the caller's: the lock screen leaves it empty, the cashier handover
 * puts "Huỷ" there, which is where a thumb already is.
 */
export function PinPad({
  value,
  onChange,
  onComplete,
  clearLabel,
  leadingKey,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete?: (pin: string) => void;
  clearLabel: string;
  leadingKey?: { label: string; onPress: () => void };
}) {
  function press(digit: string) {
    if (value.length >= PIN_LENGTH) return;
    const next = value + digit;
    onChange(next);
    if (next.length === PIN_LENGTH) onComplete?.(next);
  }

  return (
    <View className="w-full max-w-[264px] flex-row flex-wrap justify-center gap-3 self-center">
      {KEYS.map((digit) => (
        <PadKey key={digit} label={digit} onPress={() => press(digit)} />
      ))}
      {leadingKey ? (
        <PadKey label={leadingKey.label} onPress={leadingKey.onPress} variant="text" />
      ) : (
        <View className="h-[72px] w-[72px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      )}
      <PadKey label="0" onPress={() => press('0')} />
      <PadKey
        label="⌫"
        accessibilityLabel={clearLabel}
        onPress={() => onChange(value.slice(0, -1))}
        variant="text"
      />
    </View>
  );
}

function PadKey({
  label,
  accessibilityLabel,
  onPress,
  variant = 'digit',
}: {
  label: string;
  accessibilityLabel?: string;
  onPress: () => void;
  variant?: 'digit' | 'text';
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      className={`h-[72px] w-[72px] items-center justify-center rounded-full ${
        variant === 'digit' ? 'border border-border bg-surface active:bg-muted' : 'active:bg-muted'
      }`}
    >
      <Text
        variant={variant === 'digit' ? 'title' : 'label'}
        className={variant === 'digit' ? 'font-semibold text-foreground' : 'font-medium text-muted-foreground'}
      >
        {label}
      </Text>
    </Pressable>
  );
}
