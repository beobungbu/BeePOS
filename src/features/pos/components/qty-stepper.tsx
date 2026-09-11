import { useState } from 'react';
import { View } from 'react-native';
import { IconButton, Input, Text } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
}

/** IconButton -/+ with a direct numeric Input in between, per product-spec cart lines. */
export function QtyStepper({ qty, onChange }: QtyStepperProps) {
  const t = useT();
  const [text, setText] = useState(String(qty));

  function commit(value: string) {
    const parsed = Number.parseInt(value, 10);
    onChange(Number.isFinite(parsed) ? parsed : 0);
  }

  return (
    <View className="flex-row items-center gap-1">
      <IconButton
        accessibilityLabel={t('pos.cart.decreaseQty')}
        variant="outline"
        onPress={() => {
          const next = qty - 1;
          setText(String(Math.max(0, next)));
          onChange(next);
        }}
      >
        <Text>−</Text>
      </IconButton>

      <Input
        value={text}
        onChangeText={setText}
        onBlur={() => commit(text)}
        onSubmitEditing={() => commit(text)}
        keyboardType="numeric"
        size="sm"
        className="w-12 text-center"
      />

      <IconButton
        accessibilityLabel={t('pos.cart.increaseQty')}
        variant="outline"
        onPress={() => {
          const next = qty + 1;
          setText(String(next));
          onChange(next);
        }}
      >
        <Text>+</Text>
      </IconButton>
    </View>
  );
}
