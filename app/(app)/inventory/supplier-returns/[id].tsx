import { useLocalSearchParams } from 'expo-router';
import { SupplierReturnDetailScreen } from '../../../../src/features/inventory/supplier-return-detail-screen';

export default function SupplierReturnDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupplierReturnDetailScreen supplierReturnId={id} />;
}
