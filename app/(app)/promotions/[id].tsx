import { useLocalSearchParams } from 'expo-router';
import { PromotionDetailScreen } from '../../../src/features/promotions/promotion-detail-screen';

export default function PromotionDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PromotionDetailScreen promotionId={id} />;
}
