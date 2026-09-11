import { Redirect } from 'expo-router';
import { useSessionStore } from '../src/data/session-store';

export default function Index() {
  const staff = useSessionStore((state) => state.staff);
  return <Redirect href={staff ? '/pos' : '/login'} />;
}
