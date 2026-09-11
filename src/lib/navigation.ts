import { router } from 'expo-router';

/**
 * Go back when there is history, otherwise replace with a sensible fallback route.
 * A screen can be the first entry after a deep link, a reload, or a client-side
 * pushState navigation; calling router.back() there logs "GO_BACK was not handled".
 */
export function goBackOr(fallback: string): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace(fallback as never);
  }
}
