import { useLocalSearchParams } from 'expo-router';
import { ReceiptDetailScreen } from '../../../../src/features/inventory/receipt-detail-screen';

export default function ReceiptDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ReceiptDetailScreen receiptId={id} />;
}
