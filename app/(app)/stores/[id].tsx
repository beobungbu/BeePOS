import { useLocalSearchParams } from 'expo-router';
import { StoreDetailScreen } from '../../../src/features/stores/store-detail-screen';

export default function StoreDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StoreDetailScreen storeId={id} />;
}
