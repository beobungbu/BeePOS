import { Screen, SafeArea, ListGroup, ListItem, Text } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useT } from '../../src/i18n';
import { useSessionStore } from '../../src/data/session-store';

export default function SelectStoreScreen() {
  const t = useT();
  const router = useRouter();
  const storeOptions = useSessionStore((state) => state.storeOptions);
  const selectStore = useSessionStore((state) => state.selectStore);

  return (
    <Screen>
      <SafeArea className="flex-1 px-6 pt-10" edges={['top', 'bottom', 'left', 'right']}>
        <Text className="mb-6 text-xl font-semibold text-foreground">
          {t('common.auth.selectStore')}
        </Text>
        <ListGroup>
          {storeOptions.map((store) => (
            <ListItem
              key={store.id}
              title={store.name}
              description={store.address}
              onPress={() => {
                selectStore(store.id);
                router.replace('/pos');
              }}
            />
          ))}
        </ListGroup>
      </SafeArea>
    </Screen>
  );
}
