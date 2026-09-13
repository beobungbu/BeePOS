import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonLabel, SafeArea, Screen, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { nextAvailablePin } from '../../domain/auth';
import { useScreenHeader } from '../../components/shell/screen-header';
import { StaffFormFields } from './components/staff-form-fields';
import { emptyStaffForm, useStaffForm } from './staff-form-state';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

export function StaffNewScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const stores = useOrgStore((state) => state.stores);
  const staffList = useOrgStore((state) => state.staff);
  const upsertStaff = useOrgStore((state) => state.upsertStaff);

  const form = useStaffForm(emptyStaffForm(stores[0]?.id), t('staff.validation.required'));

  // Pushed route: the back control lives in the shell header.
  useScreenHeader({ title: t('staff.addStaff'), backTo: '/staff' });

  function handleCreate() {
    if (!form.validate()) return;
    const id = `staff-${staffList.length + 1}-${Date.now()}`;
    // A PIN nobody else in the chain has: the lock screen resolves a cashier from the PIN
    // alone, so a duplicate would hand the till to whoever was listed first.
    const pin = nextAvailablePin(staffList.map((member) => member.pin));
    upsertStaff({
      id,
      orgId: currentOrgId(),
      name: form.values.name,
      role: form.values.role,
      storeIds: form.values.storeIds,
      pin,
    });
    toast.show({
      title: t('staff.toast.created'),
      description: t('staff.invite.pinNote').replace('{pin}', pin),
      variant: 'success',
    });
    router.replace(`/staff/${id}`);
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
            <Text variant="title">{t('staff.addStaff')}</Text>
            <VStack gap="md">
              <StaffFormFields
                values={form.values}
                errors={form.errors}
                stores={stores}
                setField={form.setField}
                toggleStore={form.toggleStore}
              />
              <Button onPress={handleCreate}>
                <ButtonLabel>{t('common.actions.save')}</ButtonLabel>
              </Button>
            </VStack>
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
