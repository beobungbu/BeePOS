import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { Button, ButtonLabel, HStack, SafeArea, Screen, Section, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { AppIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { useOrgStore, isStaffActive } from '../../data/org-store';
import { StaffFormFields } from './components/staff-form-fields';
import { ResetPinDialog } from './components/reset-pin-dialog';
import { staffToForm, useStaffForm } from './staff-form-state';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

interface StaffDetailScreenProps {
  staffId: string;
}

export function StaffDetailScreen({ staffId }: StaffDetailScreenProps) {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const breakpoint = useBreakpoint();

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
        {/* `Screen` owns no scroll behaviour, so the form needs one here. */}
        <ScrollView className="flex-1">
          <VStack
            gap="lg"
            className={`w-full self-center ${FORM_PADDING[breakpoint]}`}
            style={{ maxWidth: FORM_MAX_WIDTH }}
          >
            <Button variant="ghost" size="sm" onPress={() => goBackOr('/staff')} className="self-start">
              <AppIcon name="chevron-left" size={16} tone="foreground" />
              <ButtonLabel>{t('common.actions.back')}</ButtonLabel>
            </Button>

            <VStack gap="xs">
              <Text variant="title">{member.name}</Text>
              <Text variant="caption" tone="muted">{t(`staff.role.${member.role}`)}</Text>
            </VStack>

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
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
