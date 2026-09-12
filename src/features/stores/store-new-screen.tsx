import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { Button, ButtonLabel, SafeArea, Screen, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { AppIcon } from '../../components/icons';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { useOrgStore } from '../../data/org-store';
import { StoreFormFields } from './components/store-form-fields';
import { emptyStoreForm, useStoreForm } from './store-form-state';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

export function StoreNewScreen() {
  const t = useT();
  const router = useRouter();
  const toast = useToast();
  const breakpoint = useBreakpoint();
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
        {/* `Screen` owns no scroll behaviour, so the form needs one here. */}
        <ScrollView className="flex-1">
          <VStack
            gap="lg"
            className={`w-full self-center ${FORM_PADDING[breakpoint]}`}
            style={{ maxWidth: FORM_MAX_WIDTH }}
          >
            <Button variant="ghost" size="sm" onPress={() => goBackOr('/stores')} className="self-start">
              <AppIcon name="chevron-left" size={16} tone="foreground" />
              <ButtonLabel>{t('common.actions.back')}</ButtonLabel>
            </Button>
            <Text variant="title">{t('stores.addStore')}</Text>
            <VStack gap="md">
              <StoreFormFields values={form.values} errors={form.errors} setField={form.setField} />
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
