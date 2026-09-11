import { Field, Input, Section, Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore } from '../../../data/settings-store';

export function PaymentSection() {
  const t = useT();
  const bankInfo = useSettingsStore((state) => state.bankInfo);
  const setBankInfo = useSettingsStore((state) => state.setBankInfo);

  return (
    <Section title={t('settings.section.payment')}>
      <VStack gap="md">
        <Field label={t('settings.payment.bankName')}>
          <Input
            value={bankInfo.bankName}
            onChangeText={(text) => setBankInfo({ ...bankInfo, bankName: text })}
            placeholder={t('settings.payment.bankNamePlaceholder')}
          />
        </Field>
        <Field label={t('settings.payment.accountNumber')}>
          <Input
            value={bankInfo.accountNumber}
            onChangeText={(text) => setBankInfo({ ...bankInfo, accountNumber: text })}
            keyboardType="number-pad"
          />
        </Field>
        <Field label={t('settings.payment.accountHolder')}>
          <Input
            value={bankInfo.accountHolder}
            onChangeText={(text) => setBankInfo({ ...bankInfo, accountHolder: text })}
            autoCapitalize="characters"
          />
        </Field>
        <Text tone="muted" variant="caption">{t('settings.payment.vietqrNote')}</Text>
      </VStack>
    </Section>
  );
}
