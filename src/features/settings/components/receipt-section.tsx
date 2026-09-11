import { Field, HStack, Section, Switch, Text, Textarea, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore } from '../../../data/settings-store';
import { ReceiptPreview } from './receipt-preview';

export function ReceiptSection() {
  const t = useT();
  const receiptHeader = useSettingsStore((state) => state.receiptHeader);
  const setReceiptHeader = useSettingsStore((state) => state.setReceiptHeader);
  const receiptFooter = useSettingsStore((state) => state.receiptFooter);
  const setReceiptFooter = useSettingsStore((state) => state.setReceiptFooter);
  const receiptShowLogo = useSettingsStore((state) => state.receiptShowLogo);
  const setReceiptShowLogo = useSettingsStore((state) => state.setReceiptShowLogo);

  return (
    <Section title={t('settings.section.receipt')}>
      <HStack gap="lg" wrap align="start">
        <VStack gap="md" className="min-w-64 flex-1">
          <Field label={t('settings.receipt.header')}>
            <Textarea
              value={receiptHeader}
              onChangeText={setReceiptHeader}
              placeholder={t('settings.receipt.headerPlaceholder')}
              numberOfLines={2}
            />
          </Field>
          <Field label={t('settings.receipt.footer')}>
            <Textarea
              value={receiptFooter}
              onChangeText={setReceiptFooter}
              placeholder={t('settings.receipt.footerPlaceholder')}
              numberOfLines={2}
            />
          </Field>
          <HStack gap="sm" align="center">
            <Switch
              accessibilityLabel={t('settings.receipt.showLogo')}
              value={receiptShowLogo}
              onValueChange={setReceiptShowLogo}
            />
            <Text>{t('settings.receipt.showLogo')}</Text>
          </HStack>
        </VStack>

        <VStack gap="xs" className="min-w-64 flex-1">
          <Text tone="muted" variant="caption">{t('settings.receipt.preview')}</Text>
          <ReceiptPreview header={receiptHeader} footer={receiptFooter} showLogo={receiptShowLogo} />
        </VStack>
      </HStack>
    </Section>
  );
}
