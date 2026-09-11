import { useRouter } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { Button, ButtonLabel, SafeArea, Screen, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { useOrgStore } from '../../data/org-store';
import { StoreFormFields } from './components/store-form-fields';
import { emptyStoreForm, useStoreForm } from './store-form-state';

export function StoreNewScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const upsertStore = useOrgStore((state) => state.upsertStore);
  const setStoreHours = useOrgStore((state) => state.setStoreHours);
  const stores = useOrgStore((state) => state.stores);

  const form = useStoreForm(emptyStoreForm(), t('stores.validation.required'));

  function handleCreate() {
    if (!form.validate()) return;
    const id = `store-${stores.length + 1}-${Date.now()}`;
    upsertStore({
      id,
      code: form.values.code,
      name: form.values.name,
      address: form.values.address,
      phone: form.values.phone,
      isActive: true,
    });
    setStoreHours(id, form.values.hours);
    toast.show({ title: t('stores.toast.created'), variant: 'success' });
    router.replace(`/stores/${id}`);
  }

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Button variant="ghost" size="sm" onPress={() => goBackOr('/stores')} className="self-start">
            <ButtonLabel>{`< ${t('common.actions.back')}`}</ButtonLabel>
          </Button>
          <Text className="text-xl font-semibold text-foreground">{t('stores.addStore')}</Text>
          <VStack gap="md">
            <StoreFormFields values={form.values} errors={form.errors} setField={form.setField} />
            <Button className="self-start" onPress={handleCreate}>
              <ButtonLabel>{t('common.actions.save')}</ButtonLabel>
            </Button>
          </VStack>
        </VStack>
      </SafeArea>
    </Screen>
  );
}
