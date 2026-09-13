import { useMemo } from 'react';
import { View } from 'react-native';
import { Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { applyPromotion } from '../../../domain/pricing';
import { formatVND, roundVND } from '../../../domain/money';
import type { Category, Product } from '../../../domain/types';
import { formToPromotion, type PromotionFormValues } from '../lib/promotion-form-state';

interface PromotionPreviewProps {
  values: PromotionFormValues;
  products: readonly Product[];
  categories: readonly Category[];
  orgId: string;
  now: Date;
}

/**
 * What the offer does to one real product, in money.
 *
 * A percentage is abstract until it is a price: the pane picks the first product the scope
 * actually covers, prices the quantity the offer needs (three units under buy 2 get 1, one
 * otherwise) and shows what the customer saves. It prices the programme as written in the
 * form, not as saved, so the figure moves while the value is being typed.
 */
export function PromotionPreview({ values, products, categories, orgId, now }: PromotionPreviewProps) {
  const t = useT();

  const preview = useMemo(() => {
    const promotion = formToPromotion(values, { id: 'promotion-preview', orgId });
    const inScope = products.filter((product) => {
      if (values.scope === 'products') return values.productIds.includes(product.id);
      if (values.scope === 'categories') return values.categoryIds.includes(product.categoryId);
      return true;
    });
    const product = inScope.find((candidate) => candidate.salePrice > 0);
    if (!product) return null;

    const qty =
      promotion.type === 'buy_x_get_y'
        ? Math.max(1, (promotion.buyQty ?? 1) + (promotion.getQty ?? 0))
        : 1;
    const unitPrice = roundVND(applyPromotion(product.salePrice, qty, promotion));
    const listTotal = roundVND(product.salePrice * qty);
    const finalTotal = roundVND(unitPrice * qty);

    return {
      product,
      category: categories.find((entry) => entry.id === product.categoryId)?.name,
      qty,
      unitPrice,
      listTotal,
      finalTotal,
      saved: roundVND(listTotal - finalTotal),
      running:
        values.isActive &&
        promotion.startsAt.getTime() <= now.getTime() &&
        promotion.endsAt.getTime() >= now.getTime(),
    };
  }, [values, products, categories, orgId, now]);

  if (!preview) {
    return (
      <VStack gap="xs" className="rounded-lg border border-border bg-surface p-4">
        <Text variant="label" className="font-semibold text-foreground">
          {t('promotions.preview.title')}
        </Text>
        <Text variant="caption" className="text-muted-foreground">
          {t('promotions.preview.noProduct')}
        </Text>
      </VStack>
    );
  }

  return (
    <VStack gap="sm" className="rounded-lg border border-border bg-surface p-4">
      <Text variant="label" className="font-semibold text-foreground">
        {t('promotions.preview.title')}
      </Text>
      <VStack gap="xs">
        <Text variant="label" className="text-foreground" numberOfLines={1}>
          {preview.product.name}
        </Text>
        <Text variant="caption" className="text-muted-foreground" numberOfLines={1}>
          {[preview.product.sku, preview.category].filter(Boolean).join(' · ')}
        </Text>
      </VStack>

      <PreviewRow label={t('promotions.preview.qty')} value={String(preview.qty)} />
      <PreviewRow label={t('promotions.preview.listPrice')} value={formatVND(preview.listTotal)} />
      <PreviewRow
        label={t('promotions.preview.finalPrice')}
        value={formatVND(preview.finalTotal)}
        strong
      />
      <PreviewRow
        label={t('promotions.preview.saved')}
        value={formatVND(preview.saved)}
        tone="success"
      />
      <PreviewRow
        label={t('promotions.preview.perUnit')}
        value={formatVND(preview.unitPrice)}
      />

      {preview.running ? null : (
        <Text variant="caption" className="text-warning">
          {t('promotions.preview.notRunning')}
        </Text>
      )}
    </VStack>
  );
}

function PreviewRow({
  label,
  value,
  strong = false,
  tone = 'foreground',
}: {
  label: string;
  value: string;
  strong?: boolean;
  tone?: 'foreground' | 'success';
}) {
  return (
    <View className="min-h-8 flex-row items-center justify-between gap-3">
      <Text variant="caption" className="shrink text-muted-foreground" numberOfLines={2}>
        {label}
      </Text>
      <Text
        variant="label"
        numeric="tabular"
        className={`${tone === 'success' ? 'text-success' : 'text-foreground'} ${
          strong ? 'font-bold' : 'font-medium'
        }`}
      >
        {value}
      </Text>
    </View>
  );
}
