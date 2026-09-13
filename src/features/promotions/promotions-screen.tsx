import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Button,
  ButtonLabel,
  SafeArea,
  Screen,
  SearchInput,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useRouter } from 'expo-router';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { Toolbar } from '../../components/toolbar';
import { useCatalogStore } from '../../data/catalog-store';
import { useOrgStore, currentOrgId } from '../../data/org-store';
import { usePricingStore } from '../../data/pricing-store';
import { useT } from '../../i18n';
import { PromotionForm } from './components/promotion-form';
import { PromotionList } from './components/promotion-list';
import { PromotionPreview } from './components/promotion-preview';
import {
  matchesQuery,
  promotionStatus,
  promotionStores,
  sortPromotions,
  type PromotionStatus,
} from './lib/promotion-status';
import { NEW_PROMOTION_ID, usePromotionEditor } from './use-promotion-editor';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;
/** The edit pane beside the table, at the width the mockup gives it. */
const PANE_WIDTH = 400;

type StatusFilter = PromotionStatus | 'all';

/**
 * Khuyến mãi: the list and the editor on one screen from 768 up, because editing a promotion
 * is always a comparison against the ones already running (commerce spec section B). The phone
 * keeps the list here and pushes the editor to `/promotions/<id>`, where there is room for it.
 */
export function PromotionsScreen() {
  const t = useT();
  const router = useRouter();
  const breakpoint = useBreakpoint();
  const isPhone = breakpoint === 'phone';

  const promotions = usePricingStore((state) => state.promotions);
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const stores = useOrgStore((state) => state.stores);

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [storeId, setStoreId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string>(NEW_PROMOTION_ID);

  const now = useMemo(() => new Date(), []);
  const running = promotions.filter((promotion) => promotionStatus(promotion, now) === 'active').length;

  useScreenHeader({
    title: t('promotions.title'),
    subtitle: t('promotions.subtitle').replace('{count}', String(running)),
  });

  const rows = useMemo(() => {
    const filtered = promotions.filter((promotion) => {
      if (!matchesQuery(promotion, query)) return false;
      if (status !== 'all' && promotionStatus(promotion, now) !== status) return false;
      if (storeId) {
        const ids = promotionStores(promotion);
        if (ids && !ids.includes(storeId)) return false;
      }
      return true;
    });
    return sortPromotions(filtered, now);
  }, [promotions, query, status, storeId, now]);

  const editor = usePromotionEditor(selectedId, now);

  function handleCreate() {
    if (isPhone) {
      router.push(`/promotions/${NEW_PROMOTION_ID}`);
      return;
    }
    setSelectedId(NEW_PROMOTION_ID);
  }

  function handleSelect(promotionId: string) {
    if (isPhone) {
      router.push(`/promotions/${promotionId}`);
      return;
    }
    setSelectedId(promotionId);
  }

  const searchField = (
    <View className="min-w-60 shrink">
      <SearchInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('promotions.search')}
        accessibilityLabel={t('promotions.search')}
      />
    </View>
  );

  const filters = (
    <>
      <Select value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
        <SelectTrigger className="min-w-36" accessibilityLabel={t('promotions.status.label')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('promotions.status.all')}</SelectItem>
          <SelectItem value="active">{t('promotions.status.active')}</SelectItem>
          <SelectItem value="scheduled">{t('promotions.status.scheduled')}</SelectItem>
          <SelectItem value="paused">{t('promotions.status.paused')}</SelectItem>
          <SelectItem value="expired">{t('promotions.status.expired')}</SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={storeId ?? 'all'}
        onValueChange={(value) => setStoreId(value === 'all' ? null : value)}
      >
        <SelectTrigger className="min-w-36" accessibilityLabel={t('promotions.storeFilter.label')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('promotions.storeFilter.all')}</SelectItem>
          {stores.map((store) => (
            <SelectItem key={store.id} value={store.id}>
              {store.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  const createButton = (
    <Button onPress={handleCreate} size="sm" accessibilityLabel={t('promotions.create')}>
      <ButtonLabel>{t('promotions.create')}</ButtonLabel>
    </Button>
  );

  const list = (
    <PromotionList
      promotions={rows}
      stores={stores}
      now={now}
      selectedId={isPhone ? undefined : selectedId}
      onSelect={handleSelect}
      layout={isPhone ? 'list' : 'table'}
    />
  );

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <View className="border-b border-border bg-surface px-4">
          <Toolbar
            search={searchField}
            activeFilterCount={(status === 'all' ? 0 : 1) + (storeId ? 1 : 0)}
            actions={createButton}
          >
            {filters}
          </Toolbar>
        </View>

        {isPhone ? (
          <ScrollView className="flex-1">
            <VStack gap="md" className={GUTTER[breakpoint]}>
              {promotions.length === 0 ? <Text tone="muted">{t('promotions.empty')}</Text> : list}
            </VStack>
          </ScrollView>
        ) : (
          <View className="min-h-0 flex-1 flex-row">
            <ScrollView className="min-w-0 flex-1">
              <VStack gap="md" className={GUTTER[breakpoint]}>
                {promotions.length === 0 ? <Text tone="muted">{t('promotions.empty')}</Text> : list}
              </VStack>
            </ScrollView>

            {/* `flex-none`: a `ScrollView` carries `flexGrow: 1` on web, so a pane given a
                width still took half the free space and squeezed the table to 400 pt. */}
            <ScrollView
              className="flex-none border-l border-border bg-surface"
              style={{ width: PANE_WIDTH, flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={{ padding: 16 }}
            >
              <VStack gap="md">
                <Text variant="title" numberOfLines={2}>
                  {editor.promotion?.name ?? t('promotions.form.newTitle')}
                </Text>
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
                    if (saved) setSelectedId(saved.id);
                  }}
                  secondaryAction={
                    editor.promotion ? (
                      <Button
                        variant="outline"
                        onPress={() => editor.setActive(!editor.promotion?.isActive)}
                        accessibilityLabel={
                          editor.promotion.isActive
                            ? t('promotions.form.pause')
                            : t('promotions.form.resume')
                        }
                      >
                        {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the
                            variant, unreadable on an outline button in dark (findings-18-w-c). */}
                        <ButtonLabel className="text-foreground">
                          {editor.promotion.isActive
                            ? t('promotions.form.pause')
                            : t('promotions.form.resume')}
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
          </View>
        )}
      </SafeArea>
    </Screen>
  );
}
