import { Input } from '@beemvp/beeui-ui';
import { formatMoneyDraft, nextMoneyDigits } from '../lib/money-draft';

interface MoneyInputProps {
  /** Digits only, no separators: the value the payment draft parses. */
  value: string;
  onChangeText: (digits: string) => void;
}

/**
 * The money field of `docs/design/design-direction.md` section 5: the amount is grouped and
 * carries its unit as it is typed (`200.000 đ`), while the state behind it stays digits only,
 * so nothing downstream has to parse a formatted string. The editing rules live in
 * `../lib/money-draft.ts`.
 *
 * The accessible name comes from the `Field` this sits in, as it did when the field was a
 * plain `Input`, so no label moves and no label is duplicated.
 */
export function MoneyInput({ value, onChangeText }: MoneyInputProps) {
  return (
    <Input
      value={formatMoneyDraft(value)}
      onChangeText={(next) => onChangeText(nextMoneyDigits(value, next))}
      keyboardType="numeric"
      placeholder="0"
      className="text-right tabular-nums"
    />
  );
}
