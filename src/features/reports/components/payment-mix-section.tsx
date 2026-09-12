import { HStack, ListGroup, ListItem, Progress, Section, Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { formatVND } from '../../../domain/money';
import type { PaymentMixEntry } from '../../../domain/reports';

interface PaymentMixSectionProps {
  rows: PaymentMixEntry[];
}

export function PaymentMixSection({ rows }: PaymentMixSectionProps) {
  const t = useT();
  const methodLabel = (method: PaymentMixEntry['method']) => t(`reports.paymentMethod.${method}`);

  return (
    <Section title={t('reports.section.paymentMix')}>
      {rows.length === 0 ? (
        <Text tone="muted">{t('reports.empty.noData')}</Text>
      ) : (
        <ListGroup>
          {rows.map((row) => (
            <ListItem
              key={row.method}
              title={methodLabel(row.method)}
              description={
                <VStack gap="xs" className="mt-1">
                  <Progress
                    accessibilityLabel={`${methodLabel(row.method)}: ${row.sharePercent}%`}
                    value={row.sharePercent}
                    size="sm"
                  />
                </VStack>
              }
              trailing={
                <HStack gap="xs" align="center">
                  <Text variant="label" numeric="tabular" className="font-bold text-foreground">{formatVND(row.amount)}</Text>
                  <Text tone="muted" variant="caption" numeric="tabular">{`${row.sharePercent}%`}</Text>
                </HStack>
              }
            />
          ))}
        </ListGroup>
      )}
    </Section>
  );
}
