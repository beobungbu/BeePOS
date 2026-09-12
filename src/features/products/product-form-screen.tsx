import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  Button,
  EmptyState,
  Field,
  HelperText,
  Input,
  KeyboardAwareScreen,
  Section,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Text,
  Textarea,
  useToast,
} from '@beemvp/beeui-ui';
import { router } from 'expo-router';
import { goBackOr } from '../../lib/navigation';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useCatalogStore } from '../../data/catalog-store';
import { isValidEan13, marginPercent, nextSku } from '../../domain/catalog';
import type { Product, ProductVariant } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useT } from '../../i18n';
import { ProductThumb } from '../../components/product-thumb';
import { useScreenHeader } from '../../components/shell/screen-header';
import { ProductStockTable } from './product-stock-table';
import { ProductVariantsSection } from './product-variants-section';
import { useUnsavedChangesGuard } from './hooks/use-unsaved-changes-guard';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

const UNITS = ['cái', 'kg', 'lốc', 'thùng', 'chai', 'gói'];
const TAX_RATES = [0, 0.05, 0.08, 0.1];

interface ProductFormValues {
  name: string;
  sku: string;
  barcode: string;
  categoryId: string;
  unit: string;
  costPrice: string;
  salePrice: string;
  taxRate: number;
  isActive: boolean;
  description: string;
  variants: ProductVariant[];
}

function fromProduct(product: Product | undefined): ProductFormValues {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    categoryId: product?.categoryId ?? '',
    unit: product?.unit ?? UNITS[0],
    costPrice: String(product?.costPrice ?? ''),
    salePrice: String(product?.salePrice ?? ''),
    taxRate: product?.taxRate ?? TAX_RATES[0],
    isActive: product?.isActive ?? true,
    description: product?.description ?? '',
    variants: product?.variants ?? [],
  };
}

interface ProductFormScreenProps {
  productId?: string;
}

export function ProductFormScreen({ productId }: ProductFormScreenProps) {
  const t = useT();
  const toast = useToast();
  const breakpoint = useBreakpoint();
  const products = useCatalogStore((state) => state.products);
  const categories = useCatalogStore((state) => state.categories);
  const upsertProduct = useCatalogStore((state) => state.upsertProduct);
  const removeProduct = useCatalogStore((state) => state.removeProduct);

  const existing = productId ? products.find((item) => item.id === productId) : undefined;
  const notFound = Boolean(productId) && !existing;

  const initial = useMemo(() => fromProduct(existing), [existing]);
  const [values, setValues] = useState<ProductFormValues>(initial);
  const [touched, setTouched] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isDirty = touched && JSON.stringify(values) !== JSON.stringify(initial);
  const guard = useUnsavedChangesGuard(isDirty);

  // Pushed route: the shell header carries the way back, so the form is never a dead end on a
  // phone, where there is no rail or sidebar to fall back on.
  useScreenHeader({
    title: existing ? t('products.form.editTitle') : t('products.form.newTitle'),
    subtitle: existing?.sku,
    backTo: '/products',
  });

  function update<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
  }

  const barcodeError = values.barcode.length > 0 && !isValidEan13(values.barcode)
    ? t('products.form.fieldBarcodeInvalid')
    : undefined;
  const nameError = touched && values.name.trim().length === 0 ? t('products.form.requiredError') : undefined;
  const skuError = touched && values.sku.trim().length === 0 ? t('products.form.requiredError') : undefined;
  const categoryError = touched && values.categoryId.length === 0 ? t('products.form.requiredError') : undefined;
  const costPrice = Number(values.costPrice);
  const salePrice = Number(values.salePrice);
  const costError = touched && !Number.isFinite(costPrice) ? t('products.form.invalidNumberError') : undefined;
  const saleError = touched && !Number.isFinite(salePrice) ? t('products.form.invalidNumberError') : undefined;

  const isValid =
    values.name.trim().length > 0 &&
    values.sku.trim().length > 0 &&
    values.categoryId.length > 0 &&
    !barcodeError &&
    Number.isFinite(costPrice) &&
    Number.isFinite(salePrice);

  function handleSuggestSku() {
    const prefix = values.categoryId ? values.categoryId.replace('cat-', 'C').toUpperCase() : 'SP';
    update('sku', nextSku(products.map((product) => product.sku), prefix));
  }

  function handleSave() {
    setTouched(true);
    if (!isValid) return;
    const product: Product = {
      id: existing?.id ?? `product-${Date.now()}`,
      sku: values.sku.trim(),
      barcode: values.barcode.trim(),
      name: values.name.trim(),
      categoryId: values.categoryId,
      unit: values.unit,
      costPrice,
      salePrice,
      taxRate: values.taxRate,
      isActive: values.isActive,
      variants: values.variants,
      description: values.description.trim() || undefined,
    };
    upsertProduct(product);
    setValues(fromProduct(product));
    setTouched(false);
    toast.show({ title: t('products.savedToast'), variant: 'success' });
    goBackOr('/products');
  }

  function handleDelete() {
    if (!existing) return;
    removeProduct(existing.id);
    toast.show({ title: t('products.deletedToast'), variant: 'success' });
    setDeleteOpen(false);
    goBackOr('/products');
  }

  if (notFound) {
    return (
      <View className="flex-1 p-4">
        <EmptyState title={t('products.noResultsTitle')} description={t('products.noResultsDescription')} />
        <Button variant="outline" onPress={() => goBackOr('/products')}>
          {t('common.actions.back')}
        </Button>
      </View>
    );
  }

  const margin = Number.isFinite(costPrice) && Number.isFinite(salePrice) ? marginPercent(costPrice, salePrice) : 0;

  return (
    <KeyboardAwareScreen contentWidth="md">
      <View
        className={`w-full self-center gap-6 ${FORM_PADDING[breakpoint]}`}
        style={{ maxWidth: FORM_MAX_WIDTH }}
      >
        <Section title={t('products.form.sectionBasics')}>
          <View className="gap-4">
            <View className="flex-row items-center gap-3">
              <ProductThumb
                name={values.name || t('products.form.fieldName')}
                categoryId={values.categoryId}
                imageUrl={existing?.imageUrl}
                size={72}
              />
              <View className="min-w-0 flex-1">
                <Text variant="label" className="font-semibold">
                  {t('products.form.imageLabel')}
                </Text>
                <Text variant="caption" tone="muted">
                  {t('products.form.imageHint')}
                </Text>
              </View>
            </View>

            <Field label={t('products.form.fieldName')} required invalid={Boolean(nameError)} error={nameError}>
              <Input value={values.name} onChangeText={(value) => update('name', value)} />
            </Field>

            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Field label={t('products.form.fieldSku')} required invalid={Boolean(skuError)} error={skuError}>
                  <Input value={values.sku} onChangeText={(value) => update('sku', value)} />
                </Field>
              </View>
              <Button variant="outline" onPress={handleSuggestSku}>
                {t('products.form.fieldSkuSuggest')}
              </Button>
            </View>

            <Field label={t('products.form.fieldBarcode')} invalid={Boolean(barcodeError)} error={barcodeError}>
              <Input value={values.barcode} onChangeText={(value) => update('barcode', value)} keyboardType="numeric" />
            </Field>

            <Field label={t('products.form.fieldCategory')} required invalid={Boolean(categoryError)} error={categoryError}>
              <Select value={values.categoryId} onValueChange={(value) => update('categoryId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('products.form.fieldCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id} textValue={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t('products.form.fieldUnit')} required>
              <Select value={values.unit} onValueChange={(value) => update('unit', value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('products.form.fieldUnit')} />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((unit) => (
                    <SelectItem key={unit} value={unit} textValue={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </View>
        </Section>

        <Section title={t('products.form.sectionPricing')}>
          <View className="gap-4">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Field label={t('products.form.fieldCostPrice')} required invalid={Boolean(costError)} error={costError}>
                  <Input value={values.costPrice} onChangeText={(value) => update('costPrice', value)} keyboardType="numeric" />
                </Field>
              </View>
              <View className="flex-1">
                <Field label={t('products.form.fieldSalePrice')} required invalid={Boolean(saleError)} error={saleError}>
                  <Input value={values.salePrice} onChangeText={(value) => update('salePrice', value)} keyboardType="numeric" />
                </Field>
                <HelperText>{`${t('products.form.fieldMargin')}: ${margin}%`}</HelperText>
              </View>
            </View>

            <Field label={t('products.form.fieldTax')} required>
              <Select value={String(values.taxRate)} onValueChange={(value) => update('taxRate', Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('products.form.fieldTax')} />
                </SelectTrigger>
                <SelectContent>
                  {TAX_RATES.map((rate) => (
                    <SelectItem key={rate} value={String(rate)} textValue={`${rate * 100}%`}>
                      {`${rate * 100}%`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </View>
        </Section>

        <Section title={t('products.form.sectionDetails')}>
          <View className="gap-4">
            <View className="min-h-11 flex-row items-center justify-between">
              <Text variant="label">{t('products.form.fieldStatus')}</Text>
              <Switch value={values.isActive} onValueChange={(value) => update('isActive', value)} accessibilityLabel={t('products.form.fieldStatus')} />
            </View>

            <Field label={t('products.form.fieldDescription')}>
              <Textarea value={values.description} onChangeText={(value) => update('description', value)} />
            </Field>

            <ProductVariantsSection variants={values.variants} onChange={(variants) => update('variants', variants)} />
          </View>
        </Section>

        {existing && (
          <Section title={t('products.form.stockTitle')}>
            <ProductStockTable productId={existing.id} layout={breakpoint === 'phone' ? 'stacked' : 'scroll'} />
          </Section>
        )}

        <View className="flex-row flex-wrap justify-between gap-2">
          {existing ? (
            <Button variant="destructive" onPress={() => setDeleteOpen(true)}>
              {t('products.form.deleteButton')}
            </Button>
          ) : (
            <View />
          )}
          <View className="flex-row gap-2">
            <Button variant="outline" onPress={() => goBackOr('/products')}>
              {t('products.form.cancelButton')}
            </Button>
            <Button onPress={handleSave}>{t('products.form.saveButton')}</Button>
          </View>
        </View>
      </View>

      <AlertDialog open={guard.promptOpen} onOpenChange={(open) => !open && guard.cancelDiscard()}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('products.form.unsavedTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('products.form.unsavedDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel onPress={guard.cancelDiscard}>{t('products.form.unsavedKeepEditing')}</AlertDialogCancel>
            <AlertDialogAction onPress={guard.confirmDiscard}>{t('products.form.unsavedDiscard')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>{t('products.deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('products.deleteConfirmDescription')}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onPress={handleDelete}>{t('products.deleteConfirmAction')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </KeyboardAwareScreen>
  );
}
