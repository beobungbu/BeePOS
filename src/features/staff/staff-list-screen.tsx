import { useRouter } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  ButtonLabel,
  Chip,
  ChipGroup,
  EmptyState,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  VStack,
} from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { useOrgStore, isStaffActive } from '../../data/org-store';

const ROLE_BADGE: Record<string, 'primary' | 'secondary' | 'outline'> = {
  owner: 'primary',
  manager: 'secondary',
  cashier: 'outline',
};

export function StaffListScreen() {
  const t = useT();
  const router = useRouter();
  const staff = useOrgStore((state) => state.staff);
  const stores = useOrgStore((state) => state.stores);
  const staffActiveById = useOrgStore((state) => state.staffActiveById);
  const storeName = (storeId: string) => stores.find((store) => store.id === storeId)?.name ?? storeId;

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Section
            title={t('staff.title')}
            action={
              <Button size="sm" onPress={() => router.push('/staff/new')}>
                <ButtonLabel>{t('staff.addStaff')}</ButtonLabel>
              </Button>
            }
          >
            {staff.length === 0 ? (
              <EmptyState title={t('staff.list.empty')} description="" />
            ) : (
              <ListGroup>
                {staff.map((member) => {
                  const active = isStaffActive(staffActiveById, member.id);
                  return (
                    <ListItem
                      key={member.id}
                      accessibilityLabel={`${member.name}, ${t(`staff.role.${member.role}`)}`}
                      onPress={() => router.push(`/staff/${member.id}`)}
                      leading={<Avatar accessibilityLabel={member.name} fallback={member.name.slice(0, 1)} />}
                      title={member.name}
                      description={
                        <ChipGroup selectionMode="multiple" value={member.storeIds} disabled>
                          {member.storeIds.map((storeId) => (
                            <Chip key={storeId} value={storeId}>
                              {storeName(storeId)}
                            </Chip>
                          ))}
                        </ChipGroup>
                      }
                      trailing={
                        <VStack gap="xs" align="end">
                          <Badge variant={ROLE_BADGE[member.role]}>{t(`staff.role.${member.role}`)}</Badge>
                          <Badge variant={active ? 'success' : 'secondary'}>
                            {active ? t('staff.status.active') : t('staff.status.inactive')}
                          </Badge>
                        </VStack>
                      }
                    />
                  );
                })}
              </ListGroup>
            )}
          </Section>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
