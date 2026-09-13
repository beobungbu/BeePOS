import { View } from 'react-native';
import { SegmentedControl, SegmentedControlItem } from '@beemvp/beeui-ui';
import { unitOptions } from '../../../domain/units';
import type { Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { unitSegmentLabel } from '../lib/wholesale';

interface UnitSelectorProps {
  product: Product;
  /** The unit currently in force; `undefined` is the product's base unit. */
  value: string | undefined;
  onChange: (unit: string | undefined, factor: number) => void;
}

/**
 * `thùng 24 / lốc 6 / lẻ` on the tile and on the cart line, per `docs/design/specs/commerce.md`
 * section A. A product with no larger unit has nothing to choose, so the control disappears
 * rather than showing one dead segment.
 *
 * The base unit is carried as the product's own unit name rather than a sentinel, so the
 * segment the cashier reads is the word printed on the shelf label.
 */
export function UnitSelector({ product, value, onChange }: UnitSelectorProps) {
  const t = useT();
  const options = unitOptions(product);
  if (options.length < 2) return null;

  const current = value ?? product.unit;

  return (
    <View className="self-stretch">
      <SegmentedControl
        // Several of these are on screen at once, one per tile and one per cart line, so the
        // group says which product it is choosing a unit for.
        accessibilityLabel={`${t('pos.wholesale.unit')} ${product.name}`}
        value={current}
        onValueChange={(next) => {
          const option = options.find((item) => item.unit === next) ?? options[0];
          onChange(option.unit === product.unit ? undefined : option.unit, option.factor);
        }}
      >
        {options.map((option) => (
          <SegmentedControlItem key={option.unit} value={option.unit}>
            {unitSegmentLabel(option.unit, option.factor)}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </View>
  );
}
