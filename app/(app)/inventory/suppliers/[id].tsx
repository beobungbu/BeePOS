import { useLocalSearchParams } from 'expo-router';
import { SupplierDetailScreen } from '../../../../src/features/suppliers/supplier-detail-screen';

export default function SupplierDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SupplierDetailScreen supplierId={id} />;
}
