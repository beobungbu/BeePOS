import { Card, Separator, Text, VStack } from '@beemvp/beeui-ui';
import { View } from 'react-native';
import { BrandMark } from '../../../components/shell/brand-mark';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';

interface ReceiptPreviewProps {
  header: string;
  footer: string;
  showLogo: boolean;
}

/**
 * Local receipt preview built from BeeUI primitives. `src/features/pos/receipt-screen.tsx`
 * is a full route screen bound to `useLocalSearchParams` and the order/catalog/customer/
 * session stores; it renders a real `Order`, not sample data, and does not export a
 * presentational sub-component. Extracting one so this settings preview (static header,
 * footer and a fixed sample line) could reuse it would mean refactoring the live checkout
 * screen, which is out of scope here, so this preview stays self-contained.
 */
export function ReceiptPreview({ header, footer, showLogo }: ReceiptPreviewProps) {
  const t = useT();

  return (
    <Card variant="outlined" padding="md" className="max-w-sm gap-2" testID="receipt-preview">
      {showLogo && (
        <View className="items-center" accessibilityLabel={t('settings.receipt.showLogo')}>
          <BrandMark size="sm" />
        </View>
      )}
      <Text className="text-center font-semibold text-foreground">{header || 'BeePOS'}</Text>
      <Separator />
      <Text tone="muted" variant="caption">{t('settings.receipt.previewSample')}</Text>
      <Text numeric="tabular" className="text-right font-medium text-foreground">{formatVND(24_000)}</Text>
      <Separator />
      <VStack gap="xs">
        <Text tone="muted" variant="caption">{t('settings.receipt.previewTotal')}</Text>
        <Text variant="title" numeric="tabular" className="text-right font-bold text-foreground">{formatVND(24_000)}</Text>
      </VStack>
      <Separator />
      <Text tone="muted" variant="caption" className="text-center">
        {footer || ' '}
      </Text>
    </Card>
  );
}
