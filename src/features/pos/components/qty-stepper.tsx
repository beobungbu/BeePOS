import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { Input } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  onRemove: () => void;
}

/**
 * Cart line quantity: 44 pt buttons around a 40 pt numeric field. At quantity 1 the minus
 * button becomes `trash-2` and removes the line in one press, per
 * `docs/design/design-direction.md` section 5.
 */
export function QtyStepper({ qty, onChange, onRemove }: QtyStepperProps) {
  const t = useT();
  const [text, setText] = useState(String(qty));

  // The quantity also changes from outside this component (tapping the tile again), so the
  // field follows the store instead of keeping a stale local copy.
  useEffect(() => setText(String(qty)), [qty]);

  function commit(value: string) {
    const parsed = Number.parseInt(value, 10);
    onChange(Number.isFinite(parsed) ? parsed : 0);
  }

  const atOne = qty <= 1;

  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        onPress={() => (atOne ? onRemove() : onChange(qty - 1))}
        accessibilityRole="button"
        accessibilityLabel={atOne ? t('pos.cart.removeLine') : t('pos.cart.decreaseQty')}
        className="h-11 w-11 items-center justify-center rounded-full border border-border active:bg-muted"
      >
        <AppIcon name={atOne ? 'trash-2' : 'minus'} size={18} tone={atOne ? 'destructive' : 'foreground'} />
      </Pressable>

      <Input
        value={text}
        onChangeText={setText}
        onBlur={() => commit(text)}
        onSubmitEditing={() => commit(text)}
        keyboardType="numeric"
        size="sm"
        className="w-10 text-center tabular-nums"
      />

      <Pressable
        onPress={() => onChange(qty + 1)}
        accessibilityRole="button"
        accessibilityLabel={t('pos.cart.increaseQty')}
        className="h-11 w-11 items-center justify-center rounded-full border border-border active:bg-muted"
      >
        <AppIcon name="plus" size={18} />
      </Pressable>
    </View>
  );
}
