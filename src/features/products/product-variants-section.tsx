import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  IconButton,
  Input,
  Text,
} from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { AppIcon } from '../../components/icons';
import type { ProductVariant } from '../../domain/types';
import { useT } from '../../i18n';

interface ProductVariantsSectionProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

function makeVariantId(): string {
  return `variant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ProductVariantsSection({ variants, onChange }: ProductVariantsSectionProps) {
  const t = useT();

  function updateVariant(id: string, patch: Partial<ProductVariant>) {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...patch } : variant)));
  }

  function addVariant() {
    onChange([...variants, { id: makeVariantId(), name: '', sku: '', salePrice: 0 }]);
  }

  function removeVariant(id: string) {
    onChange(variants.filter((variant) => variant.id !== id));
  }

  return (
    <Collapsible defaultOpen={variants.length > 0} className="gap-2">
      <CollapsibleTrigger>
        <Text variant="label">{`${t('products.form.variantsTitle')} (${variants.length})`}</Text>
      </CollapsibleTrigger>
      <CollapsibleContent className="gap-3">
        {variants.length === 0 && <Text tone="muted">{t('products.form.variantsEmpty')}</Text>}
        {variants.map((variant) => (
          <View key={variant.id} className="flex-row items-end gap-2">
            <View className="flex-1 gap-1">
              <Text variant="label">{t('products.form.variantsName')}</Text>
              <Input
                value={variant.name}
                onChangeText={(value) => updateVariant(variant.id, { name: value })}
                placeholder={t('products.form.variantsName')}
              />
            </View>
            <View className="flex-1 gap-1">
              <Text variant="label">{t('products.form.variantsSku')}</Text>
              <Input
                value={variant.sku}
                onChangeText={(value) => updateVariant(variant.id, { sku: value })}
                placeholder={t('products.form.variantsSku')}
              />
            </View>
            <View className="w-32 gap-1">
              <Text variant="label">{t('products.form.variantsPriceDelta')}</Text>
              <Input
                value={String(variant.salePrice)}
                onChangeText={(value) => updateVariant(variant.id, { salePrice: Number(value) || 0 })}
                keyboardType="numeric"
              />
            </View>
            <IconButton
              accessibilityLabel={t('products.actionsDelete')}
              variant="ghost"
              onPress={() => removeVariant(variant.id)}
            >
              <AppIcon name="trash-2" tone="destructive" />
            </IconButton>
          </View>
        ))}
        <Button variant="outline" onPress={addVariant}>
          {t('products.form.variantsAdd')}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
