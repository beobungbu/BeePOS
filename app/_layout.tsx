import '../global.css';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BeeUIProvider } from '@beemvp/beeui-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/theme/use-app-theme';
import { useHydrated } from '../src/data/persistence-bootstrap';

/**
 * The status bar follows the resolved theme, not the OS: Android draws white glyphs by
 * default, which disappeared against the light surface the header paints. `style` names the
 * content, so a light theme asks for dark glyphs and a dark theme for light ones.
 */
function ThemedStack() {
  const theme = useAppTheme();
  // Routes wait for the saved session, carts and catalogue to be read back, so the first
  // frame is never seed data that is about to be replaced.
  const hydrated = useHydrated();

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      {hydrated ? (
        <Stack screenOptions={{ headerShown: false }} />
      ) : (
        <View
          className="flex-1 items-center justify-center bg-background"
          accessibilityRole="progressbar"
          // Not from the dictionary on purpose: this frame is what the saved language
          // preference is still being read behind, so `useT` here would announce the default
          // locale rather than the cashier's. Vietnamese is the product default.
          accessibilityLabel="Đang tải dữ liệu"
        >
          <ActivityIndicator size="large" />
        </View>
      )}
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <BeeUIProvider>
          <ThemedStack />
        </BeeUIProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}
