import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  ButtonLabel,
  Field,
  HStack,
  Input,
  SearchInput,
  SegmentedControl,
  SegmentedControlItem,
  Switch,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import type { Category, Product, PromotionType, Store } from '../../../domain/types';
import type { PromotionFormErrors, PromotionFormValues } from '../lib/promotion-form-state';
import type { PromotionScope } from '../lib/promotion-status';

/** Products offered by the picker at once; the search box narrows to the rest. */
const PRODUCT_ROWS = 8;

interface PromotionFormProps {
  values: PromotionFormValues;
  errors: PromotionFormErrors;
  setField: <K extends keyof PromotionFormValues>(field: K, value: PromotionFormValues[K]) => void;
  toggleInList: (field: 'productIds' | 'categoryIds' | 'storeIds', id: string) => void;
  products: readonly Product[];
  categories: readonly Category[];
  stores: readonly Store[];
  onSave: () => void;
  /** Footer actions the screen adds beside Save (pause, resume). */
  secondaryAction?: React.ReactNode;
}

/**
 * One form for both shapes of the screen: the pane beside the table on desktop and the pushed
 * route on a phone. Scope, branches and the stacking flag are all on it, because the three of
 * them together are what decides whether two programmes fight over the same basket.
 */
export function PromotionForm({
  values,
  errors,
  setField,
  toggleInList,
  products,
  categories,
  stores,
  onSave,
  secondaryAction,
}: PromotionFormProps) {
  const t = useT();
  const [productQuery, setProductQuery] = useState('');

  const matchingProducts = products
    .filter((product) => {
      if (values.productIds.includes(product.id)) return false;
      const needle = productQuery.trim().toLowerCase();
      if (needle.length === 0) return true;
      return (
        product.name.toLowerCase().includes(needle) || product.sku.toLowerCase().includes(needle)
      );
    })
    .slice(0, PRODUCT_ROWS);

  const chosenProducts = values.productIds
    .map((id) => products.find((product) => product.id === id))
    .filter((product): product is Product => product !== undefined);

  return (
    <VStack gap="md">
      <Field label={t('promotions.form.name')} error={errors.name} invalid={Boolean(errors.name)} required>
        <Input
          value={values.name}
          onChangeText={(text) => setField('name', text)}
          placeholder={t('promotions.form.namePlaceholder')}
        />
      </Field>

      <Field label={t('promotions.type.label')}>
        <SegmentedControl
          value={values.type}
          onValueChange={(value) => setField('type', value as PromotionType)}
        >
          <SegmentedControlItem value="percent">{t('promotions.type.percent')}</SegmentedControlItem>
          <SegmentedControlItem value="amount">{t('promotions.type.amount')}</SegmentedControlItem>
          <SegmentedControlItem value="buy_x_get_y">
            {t('promotions.type.buy_x_get_y')}
          </SegmentedControlItem>
        </SegmentedControl>
      </Field>

      {values.type === 'buy_x_get_y' ? (
        <HStack gap="md" wrap align="start">
          <Field
            label={t('promotions.form.buyQty')}
            className="min-w-32 flex-1"
            error={errors.buyQty}
            invalid={Boolean(errors.buyQty)}
          >
            <Input
              value={values.buyQty}
              onChangeText={(text) => setField('buyQty', text)}
              keyboardType="number-pad"
            />
          </Field>
          <Field label={t('promotions.form.getQty')} className="min-w-32 flex-1">
            <Input
              value={values.getQty}
              onChangeText={(text) => setField('getQty', text)}
              keyboardType="number-pad"
            />
          </Field>
        </HStack>
      ) : (
        <Field
          label={values.type === 'percent' ? t('promotions.form.valuePercent') : t('promotions.form.valueAmount')}
          error={errors.value}
          invalid={Boolean(errors.value)}
          required
        >
          <Input
            value={values.value}
            onChangeText={(text) => setField('value', text)}
            keyboardType="number-pad"
          />
        </Field>
      )}

      <Field label={t('promotions.scope.label')} error={errors.scope} invalid={Boolean(errors.scope)}>
        <SegmentedControl
          value={values.scope}
          onValueChange={(value) => setField('scope', value as PromotionScope)}
        >
          <SegmentedControlItem value="all">{t('promotions.scope.all')}</SegmentedControlItem>
          <SegmentedControlItem value="categories">{t('promotions.scope.categories')}</SegmentedControlItem>
          <SegmentedControlItem value="products">{t('promotions.scope.products')}</SegmentedControlItem>
        </SegmentedControl>
      </Field>

      {values.scope === 'categories' ? (
        <VStack gap="xs">
          <Text variant="caption" className="text-muted-foreground">
            {t('promotions.scope.pickCategories')}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((category) => (
              <ToggleChip
                key={category.id}
                label={category.name}
                selected={values.categoryIds.includes(category.id)}
                onPress={() => toggleInList('categoryIds', category.id)}
              />
            ))}
          </View>
        </VStack>
      ) : null}

      {values.scope === 'products' ? (
        <VStack gap="xs">
          <Text variant="caption" className="text-muted-foreground">
            {t('promotions.scope.pickProducts')}
          </Text>
          {chosenProducts.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {chosenProducts.map((product) => (
                <ToggleChip
                  key={product.id}
                  label={product.name}
                  selected
                  onPress={() => toggleInList('productIds', product.id)}
                />
              ))}
            </View>
          ) : null}
          <SearchInput
            value={productQuery}
            onChangeText={setProductQuery}
            placeholder={t('promotions.scope.searchProduct')}
            accessibilityLabel={t('promotions.scope.searchProduct')}
          />
          {/* A capped, scrollable list rather than a dialog: picking three milks out of a
              hundred SKUs is a repeated action, and a modal per pick is three modals. */}
          <ScrollView className="max-h-56" nestedScrollEnabled>
            {matchingProducts.map((product) => (
              <Pressable
                key={product.id}
                onPress={() => toggleInList('productIds', product.id)}
                accessibilityRole="button"
                accessibilityLabel={`${product.name} · ${product.sku}`}
                className="min-h-touch-target justify-center border-b border-border px-1 py-2 active:bg-muted"
              >
                <Text variant="label" className="text-foreground" numberOfLines={1}>
                  {product.name}
                </Text>
                <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
                  {product.sku}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </VStack>
      ) : null}

      <VStack gap="xs">
        <Text variant="caption" className="text-muted-foreground">
          {t('promotions.stores.label')}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          <ToggleChip
            label={t('promotions.stores.all')}
            selected={values.storeIds.length === 0}
            onPress={() => setField('storeIds', [])}
          />
          {stores.map((store) => (
            <ToggleChip
              key={store.id}
              label={store.code}
              selected={values.storeIds.includes(store.id)}
              onPress={() => toggleInList('storeIds', store.id)}
            />
          ))}
        </View>
        <Text variant="caption" className="text-muted-foreground">
          {t('promotions.stores.hint')}
        </Text>
      </VStack>

      <HStack gap="md" wrap align="start">
        <Field
          label={t('promotions.form.startsAt')}
          className="min-w-36 flex-1"
          error={errors.window}
          invalid={Boolean(errors.window)}
        >
          <Input
            value={values.startsAt}
            onChangeText={(text) => setField('startsAt', text)}
            placeholder={t('promotions.form.datePlaceholder')}
          />
        </Field>
        <Field label={t('promotions.form.endsAt')} className="min-w-36 flex-1">
          <Input
            value={values.endsAt}
            onChangeText={(text) => setField('endsAt', text)}
            placeholder={t('promotions.form.datePlaceholder')}
          />
        </Field>
      </HStack>

      <HStack gap="sm" align="center">
        <Switch
          accessibilityLabel={t('promotions.form.active')}
          value={values.isActive}
          onValueChange={(next) => setField('isActive', next)}
        />
        <Text>{t('promotions.form.active')}</Text>
      </HStack>

      <HStack gap="sm" align="center">
        <Switch
          accessibilityLabel={t('promotions.form.stackable')}
          value={values.stackable}
          onValueChange={(next) => setField('stackable', next)}
        />
        <Text>{t('promotions.form.stackable')}</Text>
      </HStack>

      <VStack gap="xs" className="rounded-md bg-muted p-3">
        <Text variant="caption" className="text-muted-foreground">
          {t('promotions.form.autoHint')}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {t('promotions.form.stackableHint')}
        </Text>
      </VStack>

      <HStack gap="sm" wrap>
        <Button onPress={onSave} accessibilityLabel={t('promotions.form.save')}>
          <ButtonLabel>{t('promotions.form.save')}</ButtonLabel>
        </Button>
        {secondaryAction}
      </HStack>
    </VStack>
  );
}

function ToggleChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      className={`h-9 items-center justify-center rounded-full px-3 ${selected ? 'bg-primary' : 'bg-muted'}`}
    >
      <Text
        variant="label"
        className={`font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}
