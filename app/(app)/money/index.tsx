import { Redirect } from 'expo-router';

/** `/money` opens on the cash book, the screen a manager reaches for first. */
export default function MoneyIndexScreen() {
  return <Redirect href="/money/cashbook" />;
}
