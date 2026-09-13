import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  ButtonLabel,
  EmptyState,
  HStack,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  useToast,
  VStack,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { Toolbar } from '../../components/toolbar';
import { useT } from '../../i18n';
import { accountForStaff, currentOrgId, useOrgStore } from '../../data/org-store';
import { useSessionStore } from '../../data/session-store';
import type { UserAccountStatus } from '../../domain/types';
import { InviteStaffDialog, type StaffInvite } from './components/invite-staff-dialog';
import { buildInvitedMember } from './invite-staff';

const ROLE_BADGE: Record<string, 'primary' | 'secondary' | 'outline'> = {
  owner: 'primary',
  manager: 'secondary',
  cashier: 'outline',
};

/** Account state drives the badge: invited, working, or locked out of the till. */
const STATUS_BADGE: Record<UserAccountStatus, { variant: 'success' | 'warning' | 'outline'; key: string }> = {
  active: { variant: 'success', key: 'staff.status.active' },
  invited: { variant: 'warning', key: 'staff.status.invited' },
  disabled: { variant: 'outline', key: 'staff.status.disabled' },
};

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function StaffListScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const toast = useToast();
  const staff = useOrgStore((state) => state.staff);
  const stores = useOrgStore((state) => state.stores);
  const accounts = useOrgStore((state) => state.accounts);
  const staffActiveById = useOrgStore((state) => state.staffActiveById);
  const upsertStaff = useOrgStore((state) => state.upsertStaff);
  const upsertAccount = useOrgStore((state) => state.upsertAccount);
  const actor = useSessionStore((state) => state.staff);
  const sessionStore = useSessionStore((state) => state.store);
  const [inviteOpen, setInviteOpen] = useState(false);
  const storeName = (storeId: string) => stores.find((store) => store.id === storeId)?.name ?? storeId;

  const isDesktop = breakpoint === 'desktop';

  useScreenHeader({ title: t('staff.title') });

  async function handleInvite(invite: StaffInvite) {
    const { staff: member, account, temporaryPassword: password } = await buildInvitedMember(
      invite,
      currentOrgId(),
      staff.map((item) => item.pin),
    );
    upsertStaff(member);
    upsertAccount(account);
    // The prototype has no mail server, so the one-off credentials are handed over here; the
    // invited member must replace the password at their first sign-in.
    toast.show({
      title: t('staff.invite.success').replace('{email}', invite.email),
      description: `${t('staff.invite.passwordNote').replace('{password}', password)} · ${t('staff.invite.pinNote').replace('{pin}', member.pin)}`,
      variant: 'success',
    });
  }

  const actions = (
    <HStack gap="sm" className="items-center">
      <Button size="sm" variant="secondary" onPress={() => router.push('/staff/permissions')}>
        <ButtonLabel>{t('staff.permissions.action')}</ButtonLabel>
      </Button>
      <Button size="sm" variant="secondary" onPress={() => setInviteOpen(true)}>
        <ButtonLabel>{t('staff.invite.action')}</ButtonLabel>
      </Button>
      <Button size="sm" onPress={() => router.push('/staff/new')}>
        <ButtonLabel>{t('staff.addStaff')}</ButtonLabel>
      </Button>
    </HStack>
  );

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        {/* `Screen` owns no scroll behaviour, so the list needs one here. */}
        <ScrollView className="flex-1">
        {/* Desktop: the page action sits in the shared toolbar row under the app header. */}
        {isDesktop ? (
          <View className="border-b border-border bg-surface px-6">
            <Toolbar actions={actions} />
          </View>
        ) : null}
        <VStack gap="lg" className={isDesktop ? 'px-6 py-4' : GUTTER[breakpoint]}>
          {/* The screen title is in the app header; the section keeps only its action. */}
          <Section action={isDesktop ? undefined : actions}>
            {staff.length === 0 ? (
              <EmptyState title={t('staff.list.empty')} description="" />
            ) : (
              <ListGroup>
                {staff.map((member) => {
                  const account = accountForStaff(accounts, member.id);
                  const status: UserAccountStatus =
                    account?.status ?? (staffActiveById[member.id] === false ? 'disabled' : 'active');
                  const badge = STATUS_BADGE[status];
                  return (
                    <ListItem
                      key={member.id}
                      accessibilityLabel={`${member.name}, ${t(`staff.role.${member.role}`)}`}
                      onPress={() => router.push(`/staff/${member.id}`)}
                      leading={<Avatar accessibilityLabel={member.name} fallback={member.name.slice(0, 1)} fallbackClassName="text-foreground" />}
                      title={member.name}
                      description={[account?.email, member.storeIds.map(storeName).join(' · ')]
                        .filter(Boolean)
                        .join(' · ')}
                      trailing={
                        <VStack gap="xs" align="end">
                          <Badge variant={ROLE_BADGE[member.role]}>{t(`staff.role.${member.role}`)}</Badge>
                          <Badge variant={badge.variant}>{t(badge.key)}</Badge>
                        </VStack>
                      }
                    />
                  );
                })}
              </ListGroup>
            )}
          </Section>
        </VStack>
        </ScrollView>

        <InviteStaffDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          stores={stores}
          actorRole={actor?.role ?? 'owner'}
          existingEmails={accounts.map((account) => account.email)}
          defaultStoreId={sessionStore?.id}
          onInvite={(invite) => void handleInvite(invite)}
        />
      </SafeArea>
    </Screen>
  );
}
