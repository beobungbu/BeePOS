import type { ReactNode } from 'react';
import { Platform, ScrollView, type StyleProp, type ViewStyle } from 'react-native';

interface FormScrollViewProps {
  children: ReactNode;
  /** Classes for the scroll view itself, as they would be written on a `ScrollView`. */
  className?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * The scroll container every screen with a form uses.
 *
 * Two rules, both of which a plain `ScrollView` gets wrong on iOS and both of which cost a
 * cashier real money on the cash sheet (`reports/w-n-native-report.md`, P7-01, P7-03, P7-04):
 *
 * - the software keyboard covers the bottom of the screen and nothing scrolls out from under
 *   it, so a submit button below the fold cannot be reached at all: a tap aimed at it lands on
 *   a keyboard key instead, and the till records nothing while the form looks willing;
 * - with the default `keyboardShouldPersistTaps`, the first tap outside a focused field is
 *   swallowed dismissing the keyboard, so every button under an open keyboard needs two taps
 *   and reads as "the button did nothing".
 *
 * `automaticallyAdjustKeyboardInsets` rather than a `KeyboardAvoidingView`: UIKit knows where
 * this scroll view actually sits on screen, and the wrapper does not. Measured on the device,
 * a `KeyboardAvoidingView` here under-corrected by exactly the height of the app shell above
 * it (the safe-area inset plus the store header), because its `onLayout` frame is relative to
 * its parent while the keyboard frame is in screen coordinates; the difference is the
 * `keyboardVerticalOffset` every screen would then have to pass in and keep correct.
 *
 * Android resizes the window itself (Expo's default `softwareKeyboardLayoutMode` is `resize`,
 * and `app.json` does not override it) and web has no software keyboard, so the prop is iOS
 * only; react-native-web would otherwise pass an unknown attribute to the DOM node. Android is
 * unverified: no device was in this pass.
 */
export function FormScrollView({
  children,
  className,
  contentContainerStyle,
  testID,
}: FormScrollViewProps) {
  return (
    <ScrollView
      className={className}
      contentContainerStyle={contentContainerStyle}
      testID={testID}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      // A tap on a control still reaches it while the keyboard is up; a tap on the background
      // still dismisses the keyboard, which is what "handled" buys over "always".
      keyboardShouldPersistTaps="handled"
      // Dragging the form down pushes the keyboard away with the finger, the iOS convention.
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
    >
      {children}
    </ScrollView>
  );
}
