import { useLocalSearchParams } from 'expo-router';
import { PurchaseOrderDetailScreen } from '../../../../src/features/inventory/purchase-order-detail-screen';

export default function PurchaseOrderDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PurchaseOrderDetailScreen purchaseOrderId={id} />;
}
