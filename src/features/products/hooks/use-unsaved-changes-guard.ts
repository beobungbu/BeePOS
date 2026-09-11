import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

/**
 * expo-router's `useNavigation()` types as `unknown` unless given an explicit React
 * Navigation generic, and `@react-navigation/native` (which would supply that generic) is
 * not a direct dependency of this project. The `beforeRemove` event and `dispatch(action)`
 * replay are documented React Navigation runtime behavior, not a BeeUI contract, so this
 * narrow surface is typed structurally instead of importing an unavailable type or using `any`.
 */
interface NavigationLike {
  addListener: (
    event: 'beforeRemove',
    callback: (event: { preventDefault: () => void; data: { action: unknown } }) => void,
  ) => () => void;
  dispatch: (action: unknown) => void;
}

/**
 * Intercepts back navigation (gesture, back button, header back) while `isDirty` is true and
 * exposes state for an `AlertDialog` confirming the discard, instead of letting the screen
 * unmount silently. Confirming replays the navigation action that was blocked.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const navigation = useNavigation() as unknown as NavigationLike;
  const [pendingAction, setPendingAction] = useState<unknown>(null);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      if (!isDirty) return;
      event.preventDefault();
      setPendingAction(event.data.action);
    });
  }, [navigation, isDirty]);

  const confirmDiscard = useCallback(() => {
    if (pendingAction) navigation.dispatch(pendingAction);
  }, [navigation, pendingAction]);

  const cancelDiscard = useCallback(() => setPendingAction(null), []);

  return { promptOpen: pendingAction !== null, confirmDiscard, cancelDiscard };
}
