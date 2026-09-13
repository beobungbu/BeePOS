import { Badge, Button, HelperText, IconButton, Input, Text } from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { AppIcon } from '../../../components/icons';
import type { UnitConversion } from '../../../domain/types';
import { useT } from '../../../i18n';

interface ProductUnitsSectionProps {
  /** The code in the Thông tin chung field; shown here as the primary, never editable. */
  primaryBarcode: string;
  /** Base unit of the SKU, shown beside the primary code so a scan reads unambiguously. */
  baseUnit: string;
  barcodes: string[];
  units: UnitConversion[];
  onBarcodesChange: (barcodes: string[]) => void;
  onUnitsChange: (units: UnitConversion[]) => void;
}

/**
 * Extra barcodes and larger selling units, the two halves of "one SKU, several things you can
 * scan". They sit together because a case barcode is a barcode bound to a unit: scanning it has
 * to add 24 cans, not one, and that only works if the code and the factor are edited as a pair.
 */
export function ProductUnitsSection({
  primaryBarcode,
  baseUnit,
  barcodes,
  units,
  onBarcodesChange,
  onUnitsChange,
}: ProductUnitsSectionProps) {
  const t = useT();

  function updateUnit(index: number, patch: Partial<UnitConversion>) {
    onUnitsChange(units.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)));
  }

  return (
    <View className="gap-6">
      <View className="gap-3">
        <Text variant="label" className="font-semibold">{t('products.form.barcodesTitle')}</Text>
        <HelperText>{t('products.form.barcodesHint')}</HelperText>

        <View className="min-h-11 flex-row items-center gap-2">
          <AppIcon name="scan-barcode" tone="muted-foreground" />
          <View className="min-w-0 flex-1">
            <Text variant="label" numeric="tabular" className="font-semibold">
              {primaryBarcode || t('products.form.fieldBarcode')}
            </Text>
            <Text variant="caption" tone="muted">{baseUnit}</Text>
          </View>
          <Badge variant="success">{t('products.form.barcodesPrimary')}</Badge>
        </View>

        {barcodes.length === 0 && <Text tone="muted">{t('products.form.barcodesEmpty')}</Text>}

        {barcodes.map((code, index) => (
          <View key={`barcode-${index}`} className="flex-row items-center gap-2">
            <AppIcon name="scan-barcode" tone="muted-foreground" />
            <View className="flex-1">
              <Input
                accessibilityLabel={`${t('products.form.barcodesValue')} ${index + 1}`}
                value={code}
                onChangeText={(value) =>
                  onBarcodesChange(barcodes.map((entry, i) => (i === index ? value : entry)))
                }
                keyboardType="numeric"
              />
            </View>
            <IconButton
              accessibilityLabel={`${t('products.form.barcodesRemove')} ${index + 1}`}
              variant="ghost"
              onPress={() => onBarcodesChange(barcodes.filter((_, i) => i !== index))}
            >
              <AppIcon name="x" tone="destructive" />
            </IconButton>
          </View>
        ))}

        <Button variant="outline" onPress={() => onBarcodesChange([...barcodes, ''])}>
          {t('products.form.barcodesAdd')}
        </Button>
      </View>

      <View className="gap-3">
        <Text variant="label" className="font-semibold">{t('products.form.unitsTitle')}</Text>
        <HelperText>{t('products.form.unitsHint')}</HelperText>

        {units.length === 0 && <Text tone="muted">{t('products.form.unitsEmpty')}</Text>}

        {units.map((unit, index) => (
          <View key={`unit-${index}`} className="gap-2">
            <View className="flex-row items-end gap-2">
              <View className="flex-1 gap-1">
                <Text variant="label">{t('products.form.unitsName')}</Text>
                <Input
                  accessibilityLabel={`${t('products.form.unitsName')} ${index + 1}`}
                  value={unit.unit}
                  onChangeText={(value) => updateUnit(index, { unit: value })}
                />
              </View>
              <View className="w-24 gap-1">
                <Text variant="label">{t('products.form.unitsFactor')}</Text>
                <Input
                  accessibilityLabel={`${t('products.form.unitsFactor')} ${index + 1}`}
                  value={String(unit.factor)}
                  onChangeText={(value) => updateUnit(index, { factor: Math.max(1, Number(value) || 1) })}
                  keyboardType="numeric"
                />
              </View>
              <IconButton
                accessibilityLabel={`${t('products.form.unitsRemove')} ${index + 1}`}
                variant="ghost"
                onPress={() => onUnitsChange(units.filter((_, i) => i !== index))}
              >
                <AppIcon name="trash-2" tone="destructive" />
              </IconButton>
            </View>
            <View className="gap-1">
              <Text variant="label">{t('products.form.unitsBarcode')}</Text>
              <Input
                accessibilityLabel={`${t('products.form.unitsBarcode')} ${index + 1}`}
                value={unit.barcode ?? ''}
                onChangeText={(value) => updateUnit(index, { barcode: value || undefined })}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <Button variant="outline" onPress={() => onUnitsChange([...units, { unit: '', factor: 1 }])}>
          {t('products.form.unitsAdd')}
        </Button>
      </View>
    </View>
  );
}
