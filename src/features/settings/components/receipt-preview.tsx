import { Card, Separator, Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';

interface ReceiptPreviewProps {
  header: string;
  footer: string;
  showLogo: boolean;
}

/**
 * Local receipt preview built from BeeUI primitives. The real `/pos` checkout receipt
 * (src/features/pos) is owned by another phase worker who is actively editing it in
 * parallel; importing from an in-progress sibling feature folder would create an
 * unreviewable coupling point, so this settings preview is intentionally self-contained
 * rather than reusing that component (see findings file).
 */
export function ReceiptPreview({ header, footer, showLogo }: ReceiptPreviewProps) {
  const t = useT();

  return (
    <Card variant="outlined" padding="md" className="max-w-sm gap-2" testID="receipt-preview">
      {showLogo && (
        <Text className="text-center text-lg" accessibilityLabel="logo">
          🐝
        </Text>
      )}
      <Text className="text-center font-semibold text-foreground">{header || 'BeePOS'}</Text>
      <Separator />
      <Text tone="muted" variant="caption">{t('settings.receipt.previewSample')}</Text>
      <Text className="text-right font-medium text-foreground">{formatVND(24_000)}</Text>
      <Separator />
      <VStack gap="xs">
        <Text tone="muted" variant="caption">{'Tổng cộng'}</Text>
        <Text className="text-right text-lg font-semibold text-foreground">{formatVND(24_000)}</Text>
      </VStack>
      <Separator />
      <Text tone="muted" variant="caption" className="text-center">
        {footer || ' '}
      </Text>
    </Card>
  );
}
