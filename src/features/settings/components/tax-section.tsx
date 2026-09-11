import { Field, Section, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore } from '../../../data/settings-store';

const TAX_RATES = [0, 0.05, 0.08, 0.1];

export function TaxSection() {
  const t = useT();
  const defaultTaxRate = useSettingsStore((state) => state.defaultTaxRate);
  const setDefaultTaxRate = useSettingsStore((state) => state.setDefaultTaxRate);

  return (
    <Section title={t('settings.section.tax')}>
      <Field label={t('settings.tax.label')}>
        <Select
          value={String(defaultTaxRate)}
          onValueChange={(value) => setDefaultTaxRate(Number(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAX_RATES.map((rate) => (
              <SelectItem key={rate} value={String(rate)}>
                {`${Math.round(rate * 100)}%`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </Section>
  );
}
