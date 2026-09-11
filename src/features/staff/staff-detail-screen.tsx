import { useRouter } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { Button, ButtonLabel, HStack, SafeArea, Screen, Section, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { useOrgStore, isStaffActive } from '../../data/org-store';
import { StaffFormFields } from './components/staff-form-fields';
import { ResetPinDialog } from './components/reset-pin-dialog';
import { staffToForm, useStaffForm } from './staff-form-state';

interface StaffDetailScreenProps {
  staffId: string;
}

export function StaffDetailScreen({ staffId }: StaffDetailScreenProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();

  const staffList = useOrgStore((state) => state.staff);
  const stores = useOrgStore((state) => state.stores);
  const staffActiveById = useOrgStore((state) => state.staffActiveById);
  const upsertStaff = useOrgStore((state) => state.upsertStaff);
  const setStaffActive = useOrgStore((state) => state.setStaffActive);
  const resetStaffPin = useOrgStore((state) => state.resetStaffPin);

  const member = staffList.find((item) => item.id === staffId);
  const form = useStaffForm(
    member ? staffToForm(member, isStaffActive(staffActiveById, staffId)) : { name: '', phone: '', role: 'cashier', storeIds: [], active: true },
    t('staff.validation.required'),
  );

  if (!member) {
    return (
      <Screen>
        <SafeArea className="flex-1 items-center justify-center p-6" edges={['bottom', 'left', 'right']}>
          <Text tone="muted">{t('staff.list.empty')}</Text>
        </SafeArea>
      </Screen>
    );
  }

  function handleSave() {
    if (!member || !form.validate()) return;
    upsertStaff({ ...member, name: form.values.name, role: form.values.role, storeIds: form.values.storeIds });
    setStaffActive(member.id, form.values.active);
    toast.show({ title: t('staff.toast.saved'), variant: 'success' });
  }

  function handleResetPin(pin: string) {
    if (!member) return;
    resetStaffPin(member.id, pin);
    toast.show({ title: t('staff.resetPin.successToast'), variant: 'success' });
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Button variant="ghost" size="sm" onPress={() => goBackOr('/staff')} className="self-start">
            <ButtonLabel>{`< ${t('common.actions.back')}`}</ButtonLabel>
          </Button>

          <Text className="text-xl font-semibold text-foreground">{member.name}</Text>

          <Section title={t('staff.detail.info')}>
            <StaffFormFields
              values={form.values}
              errors={form.errors}
              stores={stores}
              setField={form.setField}
              toggleStore={form.toggleStore}
            />

            <HStack gap="sm" wrap className="mt-4">
              <Button onPress={handleSave}>
                <ButtonLabel>{t('staff.detail.save')}</ButtonLabel>
              </Button>
              <ResetPinDialog onConfirm={handleResetPin} />
            </HStack>
          </Section>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
