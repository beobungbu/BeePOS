import { useRouter } from 'expo-router';
import { Button, ButtonLabel, SafeArea, Screen, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { useOrgStore } from '../../data/org-store';
import { StaffFormFields } from './components/staff-form-fields';
import { emptyStaffForm, useStaffForm } from './staff-form-state';

export function StaffNewScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const stores = useOrgStore((state) => state.stores);
  const staffList = useOrgStore((state) => state.staff);
  const upsertStaff = useOrgStore((state) => state.upsertStaff);

  const form = useStaffForm(emptyStaffForm(stores[0]?.id), t('staff.validation.required'));

  function handleCreate() {
    if (!form.validate()) return;
    const id = `staff-${staffList.length + 1}-${Date.now()}`;
    upsertStaff({ id, name: form.values.name, role: form.values.role, storeIds: form.values.storeIds, pin: '1234' });
    toast.show({ title: t('staff.toast.created'), variant: 'success' });
    router.replace(`/staff/${id}`);
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Button variant="ghost" size="sm" onPress={() => router.back()} className="self-start">
            <ButtonLabel>{`< ${t('common.actions.back')}`}</ButtonLabel>
          </Button>
          <Text className="text-xl font-semibold text-foreground">{t('staff.addStaff')}</Text>
          <VStack gap="md">
            <StaffFormFields
              values={form.values}
              errors={form.errors}
              stores={stores}
              setField={form.setField}
              toggleStore={form.toggleStore}
            />
            <Button className="self-start" onPress={handleCreate}>
              <ButtonLabel>{t('common.actions.save')}</ButtonLabel>
            </Button>
          </VStack>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
