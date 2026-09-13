import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  SearchInput,
  Text,
} from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { PriceRule, Product } from '../../../domain/types';
import { useT } from '../../../i18n';
import { formatPercentDelta, vsBasePercent } from '../lib/price-rule-presentation';

interface PriceRuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The rule being edited; absent adds a new one. */
  rule?: PriceRule;
  products: Product[];
  onSave: (input: { productId: string; minQty: number; unitPrice: number }) => void;
  onRemove?: () => void;
}

/**
 * One rule is one product at one quantity threshold, so a product with three tiers is three
 * rules and this dialog edits exactly one of them. The percentage against the catalogue price
 * is shown live while the price is typed, because that is the number the person setting it is
 * actually deciding on.
 */
export function PriceRuleDialog({
  open,
  onOpenChange,
  rule,
  products,
  onSave,
  onRemove,
}: PriceRuleDialogProps) {
  const t = useT();
  const [productId, setProductId] = useState(rule?.productId ?? '');
  const [minQty, setMinQty] = useState(String(rule?.minQty ?? 1));
  const [unitPrice, setUnitPrice] = useState(rule ? String(rule.unitPrice) : '');
  const [query, setQuery] = useState('');
  const [touched, setTouched] = useState(false);

  // Seeded on the open transition during render: the same dialog serves "new" and
  // "edit", and an effect would show the previous row's values for one frame.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setProductId(rule?.productId ?? '');
      setMinQty(String(rule?.minQty ?? 1));
      setUnitPrice(rule ? String(rule.unitPrice) : '');
      setQuery('');
      setTouched(false);
    }
  }

  const product = products.find((item) => item.id === productId);
  const parsedPrice = Number.parseFloat(unitPrice);
  const priceValid = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const parsedQty = Number.parseInt(minQty, 10);
  const qty = Number.isFinite(parsedQty) && parsedQty > 0 ? parsedQty : 1;

  const delta = priceValid ? vsBasePercent(parsedPrice, product) : undefined;

  // Twenty rows is what a dialog can show without becoming a screen of its own; the search
  // narrows to them, exactly as the till's customer picker does.
  const needle = query.trim().toLowerCase();
  const matches = (needle
    ? products.filter(
        (item) =>
          item.name.toLowerCase().includes(needle) || item.sku.toLowerCase().includes(needle),
      )
    : products
  ).slice(0, 20);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{rule ? t('pricing.rules.editTitle') : t('pricing.rules.add')}</DialogTitle>
        <View className="gap-4 py-2">
          {/* A searchable list, not a `Select`: a catalogue of a hundred SKUs makes BeeUI's
              dropdown scroll, and a scrolling `SelectContent` swallows the press so the option
              cannot be picked at all (docs/beeui-audit/findings-24-chain-ops.md, 24-01). */}
          <Field
            error={touched && !product ? t('pricing.rules.productRequired') : undefined}
            invalid={touched && !product}
            label={t('pricing.rules.product')}
            required
          >
            {product ? (
              <View className="flex-row items-center gap-2 rounded-md border border-border px-3 py-2">
                <View className="min-w-0 flex-1 gap-0.5">
                  <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                    {product.sku}
                  </Text>
                </View>
                {rule ? null : (
                  <Button size="sm" variant="ghost" onPress={() => setProductId('')}>
                    {t('pricing.rules.productPlaceholder')}
                  </Button>
                )}
              </View>
            ) : (
              <View className="gap-2">
                <SearchInput
                  accessibilityLabel={t('pricing.rules.search')}
                  value={query}
                  onChangeText={setQuery}
                  onSearch={setQuery}
                  placeholder={t('pricing.rules.search')}
                />
                {matches.length === 0 ? (
                  <EmptyState title={t('pricing.rules.productPlaceholder')} />
                ) : (
                  <ScrollView
                    className="max-h-48 overflow-hidden"
                    contentContainerClassName="gap-2"
                    keyboardShouldPersistTaps="handled"
                    nestedScrollEnabled
                  >
                    {matches.map((item) => (
                      <Pressable
                        key={item.id}
                        accessibilityRole="button"
                        accessibilityLabel={item.name}
                        className="min-h-11 rounded-md border border-border px-3 py-2"
                        onPress={() => setProductId(item.id)}
                      >
                        <Text variant="label" className="font-semibold text-foreground" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text variant="caption" className="text-muted-foreground" numeric="tabular">
                          {item.sku}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </Field>
          <View className="flex-row flex-wrap gap-3">
            <Field className="min-w-32 flex-1" label={t('pricing.rules.minQty')}>
              <Input
                value={minQty}
                onChangeText={setMinQty}
                keyboardType="numeric"
                className="text-right tabular-nums"
              />
            </Field>
            <Field
              className="min-w-40 flex-1"
              error={touched && !priceValid ? t('pricing.rules.priceRequired') : undefined}
              invalid={touched && !priceValid}
              label={t('pricing.rules.unitPrice')}
              required
            >
              <Input
                value={unitPrice}
                onChangeText={setUnitPrice}
                keyboardType="numeric"
                className="text-right tabular-nums"
              />
            </Field>
          </View>
          {product ? (
            <View className="flex-row items-center justify-between gap-3">
              <Text variant="caption" className="text-muted-foreground">
                {`${t('pricing.rules.vsBase')} · ${formatVND(product.salePrice)}`}
              </Text>
              <Text
                variant="label"
                className={`font-semibold tabular-nums ${
                  delta !== undefined && delta < 0 ? 'text-success' : 'text-foreground'
                }`}
              >
                {delta !== undefined ? formatPercentDelta(delta) : '-'}
              </Text>
            </View>
          ) : null}
        </View>
        <DialogFooter>
          {onRemove ? (
            <Button
              variant="outline"
              className="border-destructive"
              labelClassName="text-destructive"
              onPress={() => {
                onRemove();
                onOpenChange(false);
              }}
            >
              {t('pricing.rules.remove')}
            </Button>
          ) : (
            <Button variant="outline" onPress={() => onOpenChange(false)}>
              {t('pricing.actions.cancel')}
            </Button>
          )}
          <Button
            onPress={() => {
              setTouched(true);
              if (!product || !priceValid) return;
              onSave({ productId, minQty: qty, unitPrice: Math.round(parsedPrice) });
              onOpenChange(false);
            }}
          >
            {t('pricing.actions.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
