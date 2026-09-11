import { useLocalSearchParams } from 'expo-router';
import { StaffDetailScreen } from '../../../src/features/staff/staff-detail-screen';

export default function StaffDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <StaffDetailScreen staffId={id} />;
}
