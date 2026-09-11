import { Checkbox, Field, FormGroup, Input, Radio, RadioGroup, Switch, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import type { Store } from '../../../domain/types';
import type { StaffFormErrors, StaffFormValues } from '../staff-form-state';

interface StaffFormFieldsProps {
  values: StaffFormValues;
  errors: StaffFormErrors;
  stores: Store[];
  setField: <K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) => void;
  toggleStore: (storeId: string, checked: boolean) => void;
}

export function StaffFormFields({ values, errors, stores, setField, toggleStore }: StaffFormFieldsProps) {
  const t = useT();

  return (
    <VStack gap="md">
      <Field label={t('staff.field.name')} error={errors.name} invalid={Boolean(errors.name)} required>
        <Input value={values.name} onChangeText={(text) => setField('name', text)} />
      </Field>
      <Field label={t('staff.field.phone')}>
        <Input value={values.phone} onChangeText={(text) => setField('phone', text)} keyboardType="phone-pad" />
      </Field>

      <FormGroup legend={t('staff.field.role')}>
        <RadioGroup value={values.role} onValueChange={(value) => setField('role', value as StaffFormValues['role'])}>
          <Radio label={t('staff.role.owner')} value="owner" />
          <Radio label={t('staff.role.manager')} value="manager" />
          <Radio label={t('staff.role.cashier')} value="cashier" />
        </RadioGroup>
      </FormGroup>

      <FormGroup
        legend={t('staff.field.stores')}
        error={errors.storeIds}
        invalid={Boolean(errors.storeIds)}
        required
      >
        <VStack gap="xs">
          {stores.map((store) => (
            <Checkbox
              key={store.id}
              label={store.name}
              checked={values.storeIds.includes(store.id)}
              onCheckedChange={(checked) => toggleStore(store.id, checked)}
            />
          ))}
        </VStack>
      </FormGroup>

      <Field label={t('staff.field.active')}>
        <Switch
          accessibilityLabel={t('staff.field.active')}
          value={values.active}
          onValueChange={(value) => setField('active', value)}
        />
      </Field>
    </VStack>
  );
}
