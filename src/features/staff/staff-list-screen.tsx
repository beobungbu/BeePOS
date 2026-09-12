import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Avatar,
  Badge,
  Button,
  ButtonLabel,
  EmptyState,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  VStack,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { Toolbar } from '../../components/toolbar';
import { useT } from '../../i18n';
import { useOrgStore, isStaffActive } from '../../data/org-store';

const ROLE_BADGE: Record<string, 'primary' | 'secondary' | 'outline'> = {
  owner: 'primary',
  manager: 'secondary',
  cashier: 'outline',
};

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function StaffListScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const staff = useOrgStore((state) => state.staff);
  const stores = useOrgStore((state) => state.stores);
  const staffActiveById = useOrgStore((state) => state.staffActiveById);
  const storeName = (storeId: string) => stores.find((store) => store.id === storeId)?.name ?? storeId;

  const isDesktop = breakpoint === 'desktop';

  useScreenHeader({ title: t('staff.title') });

  const addButton = (
    <Button size="sm" onPress={() => router.push('/staff/new')}>
      <ButtonLabel>{t('staff.addStaff')}</ButtonLabel>
    </Button>
  );

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        {/* `Screen` owns no scroll behaviour, so the list needs one here. */}
        <ScrollView className="flex-1">
        {/* Desktop: the page action sits in the shared toolbar row under the app header. */}
        {isDesktop ? (
          <View className="border-b border-border bg-surface px-6">
            <Toolbar actions={addButton} />
          </View>
        ) : null}
        <VStack gap="lg" className={isDesktop ? 'px-6 py-4' : GUTTER[breakpoint]}>
          {/* The screen title is in the app header; the section keeps only its action. */}
          <Section action={isDesktop ? undefined : addButton}>
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
                      leading={<Avatar accessibilityLabel={member.name} fallback={member.name.slice(0, 1)} fallbackClassName="text-foreground" />}
                      title={member.name}
                      description={member.storeIds.map(storeName).join(' · ')}
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
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
