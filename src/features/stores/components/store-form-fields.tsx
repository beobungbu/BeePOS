import { Field, Input, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import type { StoreFormErrors, StoreFormValues } from '../store-form-state';

interface StoreFormFieldsProps {
  values: StoreFormValues;
  errors: StoreFormErrors;
  setField: <K extends keyof StoreFormValues>(key: K, value: StoreFormValues[K]) => void;
}

export function StoreFormFields({ values, errors, setField }: StoreFormFieldsProps) {
  const t = useT();

  return (
    <VStack gap="md">
      <Field label={t('stores.field.code')} error={errors.code} invalid={Boolean(errors.code)} required>
        <Input value={values.code} onChangeText={(text) => setField('code', text)} autoCapitalize="characters" />
      </Field>
      <Field label={t('stores.field.name')} error={errors.name} invalid={Boolean(errors.name)} required>
        <Input value={values.name} onChangeText={(text) => setField('name', text)} />
      </Field>
      <Field label={t('stores.field.address')} error={errors.address} invalid={Boolean(errors.address)} required>
        <Input value={values.address} onChangeText={(text) => setField('address', text)} />
      </Field>
      <Field label={t('stores.field.phone')} error={errors.phone} invalid={Boolean(errors.phone)} required>
        <Input value={values.phone} onChangeText={(text) => setField('phone', text)} keyboardType="phone-pad" />
      </Field>
      <Field label={t('stores.field.hours')}>
        <Input value={values.hours} onChangeText={(text) => setField('hours', text)} placeholder="08:00 - 21:00" />
      </Field>
    </VStack>
  );
}
