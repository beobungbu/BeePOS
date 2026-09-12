import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Badge,
  Button,
  ButtonLabel,
  EmptyState,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { staffCountForStore } from '../../domain/org';
import { useOrgStore } from '../../data/org-store';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

export function StoreListScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isWide = breakpoint !== 'phone';

  const stores = useOrgStore((state) => state.stores);
  const staff = useOrgStore((state) => state.staff);
  const setStoreActive = useOrgStore((state) => state.setStoreActive);

  useScreenHeader({ title: t('stores.title') });

  function statusBadge(isActive: boolean) {
    return (
      <Badge variant={isActive ? 'success' : 'secondary'}>
        {isActive ? t('stores.status.active') : t('stores.status.inactive')}
      </Badge>
    );
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        {/* `Screen` owns no scroll behaviour, so the list needs one here. */}
        <ScrollView className="flex-1">
          <VStack gap="lg" className={GUTTER[breakpoint]}>
            {/* The screen title is in the app header; the section keeps only its action. */}
            <Section
              action={
                <Button size="sm" onPress={() => router.push('/stores/new')}>
                  <ButtonLabel>{t('stores.addStore')}</ButtonLabel>
                </Button>
              }
            >
              {stores.length === 0 ? (
                <EmptyState title={t('stores.list.empty')} description="" />
              ) : isWide ? (
                <Table layout="scroll">
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('stores.field.code')}</TableHead>
                      <TableHead>{t('stores.field.name')}</TableHead>
                      <TableHead>{t('stores.field.address')}</TableHead>
                      <TableHead>{t('stores.field.phone')}</TableHead>
                      <TableHead>{t('stores.list.staffCount')}</TableHead>
                      <TableHead label={t('stores.status.label')}>{t('stores.status.label')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stores.map((store) => (
                      <TableRow key={store.id}>
                        <TableCell>
                          <Badge variant="outline">{store.code}</Badge>
                        </TableCell>
                        <TableCell>
                          <Text
                            variant="label"
                            className="font-semibold text-foreground"
                            accessibilityRole="button"
                            onPress={() => router.push(`/stores/${store.id}`)}
                          >
                            {store.name}
                          </Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="label" tone="muted">{store.address}</Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="label" numeric="tabular">{store.phone}</Text>
                        </TableCell>
                        <TableCell>
                          <Text variant="label" numeric="tabular" className="w-full text-right">
                            {String(staffCountForStore(staff, store.id))}
                          </Text>
                        </TableCell>
                        <TableCell label={t('stores.status.label')}>
                          <View className="min-h-11 flex-row items-center gap-2">
                            <Switch
                              accessibilityLabel={`${t('stores.status.label')} ${store.name}`}
                              value={store.isActive}
                              onValueChange={(value) => setStoreActive(store.id, value)}
                            />
                            {statusBadge(store.isActive)}
                          </View>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <ListGroup>
                  {stores.map((store) => (
                    <ListItem
                      key={store.id}
                      title={store.name}
                      description={`${store.code} · ${store.address}`}
                      onPress={() => router.push(`/stores/${store.id}`)}
                      accessibilityLabel={`${store.name}, ${store.code}`}
                      trailing={
                        <VStack gap="xs" align="end">
                          {statusBadge(store.isActive)}
                          <Text variant="caption" tone="muted" numeric="tabular">
                            {`${staffCountForStore(staff, store.id)} ${t('stores.list.staffCount')}`}
                          </Text>
                        </VStack>
                      }
                    />
                  ))}
                </ListGroup>
              )}
            </Section>
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
