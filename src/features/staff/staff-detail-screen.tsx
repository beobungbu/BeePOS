import { ScrollView } from 'react-native';
import {
  Badge,
  Button,
  ButtonLabel,
  HStack,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  Text,
  useToast,
  VStack,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { formatDateTime } from '../../lib/datetime';
import { useT } from '../../i18n';
import { fill } from '../orders/lib/fill';
import { recordAudit } from '../../data/audit-store';
import { accountForStaff, useOrgStore, isStaffActive } from '../../data/org-store';
import { useScreenHeader } from '../../components/shell/screen-header';
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
  const toast = useToast();
  const breakpoint = useBreakpoint();

  const staffList = useOrgStore((state) => state.staff);
  const stores = useOrgStore((state) => state.stores);
  const staffActiveById = useOrgStore((state) => state.staffActiveById);
  const accounts = useOrgStore((state) => state.accounts);
  const upsertStaff = useOrgStore((state) => state.upsertStaff);
  const setStaffActive = useOrgStore((state) => state.setStaffActive);
  const resetStaffPin = useOrgStore((state) => state.resetStaffPin);

  const member = staffList.find((item) => item.id === staffId);
  const account = accountForStaff(accounts, staffId);

  // Pushed route: the back control lives in the shell header, with the member as the title.
  useScreenHeader({ title: member?.name ?? t('staff.title'), backTo: '/staff' });
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
    recordAudit({
      action: 'staffPinReset',
      entity: 'staff',
      entityId: member.id,
      summary: fill(t('chain.audit.summary.pinReset'), { name: member.name }),
    });
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
            <VStack gap="xs">
              <Text variant="title">{member.name}</Text>
              <Text variant="caption" tone="muted">{t(`staff.role.${member.role}`)}</Text>
            </VStack>

            {/* The sign-in account beside the roster entry: "is this person set up yet" is the
                question the staff screen is opened with, and an invite that was never accepted
                looks exactly like an active member without it. */}
            <Section title={t('staff.account.title')}>
              <ListGroup>
                <ListItem
                  title={account?.email ?? t('staff.account.none')}
                  description={
                    account?.lastLoginAt
                      ? `${t('staff.account.lastLogin')}: ${formatDateTime(account.lastLoginAt.toISOString())}`
                      : t('staff.account.never')
                  }
                  trailing={
                    account ? (
                      <Badge variant={account.status === 'active' ? 'success' : account.status === 'invited' ? 'warning' : 'secondary'}>
                        {t(`staff.status.${account.status}`)}
                      </Badge>
                    ) : undefined
                  }
                />
              </ListGroup>
            </Section>

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
