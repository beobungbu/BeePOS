import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Badge,
  Button,
  ButtonLabel,
  Card,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
  Text,
} from '@beemvp/beeui-ui';
import { formatVND } from '../../../domain/money';
import type { Product, StockLevel } from '../../../domain/types';
import { useT } from '../../../i18n';

interface ProductCardProps {
  product: Product;
  stock: StockLevel | undefined;
  onAdd: () => void;
}

/**
 * Tap anywhere on the price/stock area to add one unit; the info icon is a sibling
 * pressable (not nested inside it) so the "ⓘ" tap does not also trigger add-to-cart.
 * See docs/beeui-audit/findings-01-pos.md, finding pos-02, for why triggers stay
 * unnested here (mirrors the nested-pressable pitfall phase 0 hit with DropdownMenuTrigger).
 */
export function ProductCard({ product, stock, onAdd }: ProductCardProps) {
  const t = useT();
  const [detailOpen, setDetailOpen] = useState(false);
  const onHand = stock?.onHand ?? 0;
  const minLevel = stock?.minLevel ?? 0;
  const outOfStock = onHand <= 0;
  const lowStock = !outOfStock && onHand <= minLevel;
  const badgeVariant = outOfStock ? 'destructive' : lowStock ? 'warning' : 'outline';
  const badgeLabel = outOfStock ? t('pos.stockOut') : lowStock ? t('pos.stockLow') : String(onHand);

  return (
    <Card padding="sm" className="gap-2">
      <View className="flex-row items-start justify-between gap-1">
        <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={2}>
          {product.name}
        </Text>
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogTrigger accessibilityLabel={t('pos.productDetail.trigger')} variant="ghost" size="icon">
            <Text className="text-muted-foreground">ⓘ</Text>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{product.name}</DialogTitle>
            <DialogDescription>
              {t('pos.productDetail.sku')}: {product.sku} · {t('pos.productDetail.barcode')}: {product.barcode}
            </DialogDescription>
            <View className="gap-1 py-2">
              <Text className="text-sm text-muted-foreground">
                {t('pos.productDetail.price')}: {formatVND(product.salePrice)}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {t('pos.unit')}: {product.unit}
              </Text>
              <Text className="text-sm text-muted-foreground">
                {t('pos.productDetail.stock')}: {onHand}
              </Text>
            </View>
            <DialogFooter>
              <DialogClose variant="outline">
                <ButtonLabel>{t('common.actions.close')}</ButtonLabel>
              </DialogClose>
              <Button
                disabled={outOfStock}
                onPress={() => {
                  onAdd();
                  setDetailOpen(false);
                }}
              >
                <ButtonLabel>{t('pos.productDetail.add')}</ButtonLabel>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </View>

      <Pressable onPress={onAdd} disabled={outOfStock} className="gap-1">
        <Text className="text-xs text-muted-foreground">{product.unit}</Text>
        <Text className="text-base font-semibold text-foreground">{formatVND(product.salePrice)}</Text>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </Pressable>
    </Card>
  );
}
