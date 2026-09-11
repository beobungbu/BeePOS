import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Badge,
  Button,
  ButtonLabel,
  EmptyState,
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
import { useT } from '../../i18n';
import { staffCountForStore } from '../../domain/org';
import { useOrgStore } from '../../data/org-store';

const WIDE_BREAKPOINT = 768;

export function StoreListScreen() {
  const t = useT();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;

  const stores = useOrgStore((state) => state.stores);
  const staff = useOrgStore((state) => state.staff);
  const setStoreActive = useOrgStore((state) => state.setStoreActive);

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Section
            title={t('stores.title')}
            action={
              <Button size="sm" onPress={() => router.push('/stores/new')}>
                <ButtonLabel>{t('stores.addStore')}</ButtonLabel>
              </Button>
            }
          >
            {stores.length === 0 ? (
              <EmptyState title={t('stores.list.empty')} description="" />
            ) : (
              <Table layout={isWide ? 'scroll' : 'stacked'}>
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
                        <Text
                          className="font-medium text-primary underline"
                          onPress={() => router.push(`/stores/${store.id}`)}
                        >
                          {store.code}
                        </Text>
                      </TableCell>
                      <TableCell>{store.name}</TableCell>
                      <TableCell>{store.address}</TableCell>
                      <TableCell>{store.phone}</TableCell>
                      <TableCell>{String(staffCountForStore(staff, store.id))}</TableCell>
                      <TableCell label={t('stores.status.label')}>
                        <Switch
                          accessibilityLabel={`${t('stores.status.label')} ${store.name}`}
                          value={store.isActive}
                          onValueChange={(value) => setStoreActive(store.id, value)}
                        />
                        <Badge variant={store.isActive ? 'success' : 'secondary'} className="ml-2">
                          {store.isActive ? t('stores.status.active') : t('stores.status.inactive')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Section>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
