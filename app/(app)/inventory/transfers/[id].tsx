import { useLocalSearchParams } from 'expo-router';
import { TransferDetailScreen } from '../../../../src/features/inventory/transfer-detail-screen';

export default function TransferDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TransferDetailScreen transferId={id} />;
}
