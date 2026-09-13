import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { Button, ButtonLabel, SafeArea, Screen, VStack } from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useCatalogStore } from '../../data/catalog-store';
import { currentOrgId, useOrgStore } from '../../data/org-store';
import { useT } from '../../i18n';
import { PromotionForm } from './components/promotion-form';
import { PromotionPreview } from './components/promotion-preview';
import { usePromotionEditor } from './use-promotion-editor';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/**
 * The promotion editor as its own route. This is the phone's form, and the deep link the
 * command palette and a bookmark reach; on a wide screen the same editor also lives in the
 * pane beside the list, and both go through `usePromotionEditor`.
 */
export function PromotionDetailScreen({ promotionId }: { promotionId: string }) {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const stores = useOrgStore((state) => state.stores);
  const now = useMemo(() => new Date(), []);
  const editor = usePromotionEditor(promotionId, now);

  useScreenHeader({
    title: editor.promotion?.name ?? t('promotions.form.newTitle'),
    backTo: '/promotions',
  });

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <VStack
            gap="lg"
            className={`w-full self-center ${GUTTER[breakpoint]}`}
            style={{ maxWidth: FORM_MAX_WIDTH }}
          >
            <PromotionForm
              values={editor.form.values}
              errors={editor.form.errors}
              setField={editor.form.setField}
              toggleInList={editor.form.toggleInList}
              products={products}
              categories={categories}
              stores={stores}
              onSave={() => {
                const saved = editor.save();
                // A new programme keeps its own route after the first save, so the back
                // control still goes to the list instead of to a form that no longer exists.
                if (saved) router.replace(`/promotions/${saved.id}`);
              }}
              secondaryAction={
                editor.promotion ? (
                  <Button
                    variant="outline"
                    onPress={() => editor.setActive(!editor.promotion?.isActive)}
                    accessibilityLabel={
                      editor.promotion.isActive ? t('promotions.form.pause') : t('promotions.form.resume')
                    }
                  >
                    {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the
                        variant, unreadable on an outline button in dark (findings-18-w-c). */}
                    <ButtonLabel className="text-foreground">
                      {editor.promotion.isActive ? t('promotions.form.pause') : t('promotions.form.resume')}
                    </ButtonLabel>
                  </Button>
                ) : null
              }
            />
            <PromotionPreview
              values={editor.form.values}
              products={products}
              categories={categories}
              orgId={currentOrgId()}
              now={now}
            />
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
