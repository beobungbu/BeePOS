import { useLocalSearchParams } from 'expo-router';
import { CountDetailScreen } from '../../../../src/features/inventory/count-detail-screen';

export default function CountDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CountDetailScreen countId={id} />;
}
