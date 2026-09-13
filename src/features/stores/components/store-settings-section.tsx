import { useState } from 'react';
import { View } from 'react-native';
import {
  Badge,
  Button,
  ButtonLabel,
  Field,
  HStack,
  Input,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
  useToast,
  VStack,
} from '@beemvp/beeui-ui';
import { useOrgSettingsStore, settingsForStore } from '../../../data/org-settings-store';
import { useOrgStore } from '../../../data/org-store';
import { PRINTERS } from '../../settings/lib/printers';
import { useEffectiveStoreSettings } from '../../settings/lib/effective-store-settings';
import { useT } from '../../../i18n';

/** The value a `Select` uses for "no override", since a select cannot hold an empty string. */
const INHERIT = 'inherit';

interface StoreSettingsFormValues {
  receiptHeader: string;
  receiptFooter: string;
  /** Percent as typed (`10`), converted to the stored fraction on save. */
  taxRate: string;
  openingHours: string;
  printerName: string;
}

/**
 * Per branch overrides for what this shop prints and charges. An empty field means inherit,
 * and the chain's value is shown as the placeholder so the reader can see what they would be
 * inheriting before they decide to override it (`docs/design/specs/commerce.md` section G).
 *
 * Opening hours are written to the branch settings and to the org store's hours map together,
 * because the store form above this section edits the same fact and two fields disagreeing
 * about when a shop opens is worse than either of them being wrong.
 */
export function StoreSettingsSection({ storeId }: { storeId: string }) {
  const t = useT();
  const toast = useToast();
  const storeSettings = useOrgSettingsStore((state) => state.storeSettings);
  const setStoreSettings = useOrgSettingsStore((state) => state.setStoreSettings);
  const clearStoreSettings = useOrgSettingsStore((state) => state.clearStoreSettings);
  const setStoreHours = useOrgStore((state) => state.setStoreHours);
  const effective = useEffectiveStoreSettings(storeId);

  const own = settingsForStore(storeSettings, storeId);
  const [values, setValues] = useState<StoreSettingsFormValues>(() => toForm(own));
  const [seededStoreId, setSeededStoreId] = useState(storeId);

  // Opening another branch re-seeds the fields; editing them does not. Adjusted during render
  // rather than in an effect, so the form never paints the previous branch's values.
  if (storeId !== seededStoreId) {
    setSeededStoreId(storeId);
    setValues(toForm(own));
  }

  function setField<K extends keyof StoreSettingsFormValues>(key: K, value: StoreSettingsFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave() {
    const taxPercent = values.taxRate.trim();
    const parsedTax = Number(taxPercent.replace(',', '.'));
    setStoreSettings(storeId, {
      receiptHeader: blankToUndefined(values.receiptHeader),
      receiptFooter: blankToUndefined(values.receiptFooter),
      // Stored as a fraction, the same shape as the chain's default tax rate.
      taxRate: taxPercent.length > 0 && Number.isFinite(parsedTax) ? parsedTax / 100 : undefined,
      openingHours: blankToUndefined(values.openingHours),
      printerName: blankToUndefined(values.printerName),
    });
    if (values.openingHours.trim().length > 0) setStoreHours(storeId, values.openingHours.trim());
    toast.show({ title: t('stores.settings.saved'), variant: 'success' });
  }

  function handleClear() {
    clearStoreSettings(storeId);
    setValues(toForm(undefined));
    toast.show({ title: t('stores.settings.cleared'), variant: 'info' });
  }

  const overrideCount = effective.overrides.length;

  return (
    <Section title={t('stores.settings.title')}>
      <VStack gap="md">
        <HStack gap="sm" wrap align="center">
          <Badge variant={overrideCount > 0 ? 'warning' : 'outline'}>
            {overrideCount > 0
              ? t('stores.settings.overrideCount').replace('{count}', String(overrideCount))
              : t('stores.settings.noOverride')}
          </Badge>
          <Text variant="caption" tone="muted">
            {t('stores.settings.hint')}
          </Text>
        </HStack>

        <Field label={t('stores.settings.receiptHeader')}>
          <Textarea
            value={values.receiptHeader}
            onChangeText={(text) => setField('receiptHeader', text)}
            placeholder={t('stores.settings.inheritValue').replace('{value}', effective.receiptHeader)}
            numberOfLines={2}
          />
        </Field>

        <Field label={t('stores.settings.receiptFooter')}>
          <Textarea
            value={values.receiptFooter}
            onChangeText={(text) => setField('receiptFooter', text)}
            placeholder={t('stores.settings.inheritValue').replace('{value}', effective.receiptFooter)}
            numberOfLines={2}
          />
        </Field>

        <HStack gap="md" wrap align="start">
          <Field
            label={t('stores.settings.taxRate')}
            className="min-w-36 flex-1"
            description={t('stores.settings.taxHint')}
          >
            <Input
              value={values.taxRate}
              onChangeText={(text) => setField('taxRate', text)}
              keyboardType="number-pad"
              placeholder={String(Math.round(effective.taxRate * 100))}
            />
          </Field>
          <Field label={t('stores.settings.openingHours')} className="min-w-36 flex-1">
            <Input
              value={values.openingHours}
              onChangeText={(text) => setField('openingHours', text)}
              placeholder={effective.openingHours}
            />
          </Field>
        </HStack>

        <Field label={t('stores.settings.printerName')}>
          <Select
            value={values.printerName.length > 0 ? values.printerName : INHERIT}
            onValueChange={(value) => setField('printerName', value === INHERIT ? '' : value)}
          >
            <SelectTrigger accessibilityLabel={t('stores.settings.printerName')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={INHERIT}>
                {effective.printerName
                  ? t('stores.settings.inheritValue').replace('{value}', effective.printerName)
                  : t('stores.settings.inherit')}
              </SelectItem>
              {PRINTERS.map((printer) => (
                <SelectItem key={printer.id} value={printer.name}>
                  {printer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <View className="flex-row flex-wrap gap-2">
          <Button onPress={handleSave} accessibilityLabel={t('stores.settings.save')}>
            <ButtonLabel>{t('stores.settings.save')}</ButtonLabel>
          </Button>
          <Button
            variant="outline"
            onPress={handleClear}
            disabled={overrideCount === 0}
            accessibilityLabel={t('stores.settings.reset')}
          >
            {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the variant,
                unreadable on an outline button in dark (findings-18-w-c). */}
            <ButtonLabel className="text-foreground">{t('stores.settings.reset')}</ButtonLabel>
          </Button>
        </View>
      </VStack>
    </Section>
  );
}

function toForm(own: ReturnType<typeof settingsForStore>): StoreSettingsFormValues {
  return {
    receiptHeader: own?.receiptHeader ?? '',
    receiptFooter: own?.receiptFooter ?? '',
    taxRate: own?.taxRate === undefined ? '' : String(Math.round(own.taxRate * 100)),
    openingHours: own?.openingHours ?? '',
    printerName: own?.printerName ?? '',
  };
}

/** An empty field is an inherit, never an override that prints nothing. */
function blankToUndefined(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
