import { useLocalSearchParams } from 'expo-router';
import { ReturnScreen } from '../../../src/features/returns/return-screen';

/**
 * `/pos/returns`, optionally deep linked as `?order=<code>` from an order's
 * "Trả / đổi hàng" action.
 *
 * The code is the remount key. The app area renders through a `Slot`, so arriving again with
 * a different order would otherwise re-render the same screen instance and leave the previous
 * order's draft on it; keying the screen throws that draft away, which is the only safe answer
 * when the cashier has moved on to a different bill.
 */
export default function PosReturnsRoute() {
  const { order } = useLocalSearchParams<{ order?: string }>();
  const code = typeof order === 'string' ? order.trim() : undefined;
  return <ReturnScreen key={code || 'blank'} orderCode={code || undefined} />;
}
