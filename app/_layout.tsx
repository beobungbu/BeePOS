import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BeeUIProvider } from '@beemvp/beeui-ui';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAppTheme } from '../src/theme/use-app-theme';

/**
 * The status bar follows the resolved theme, not the OS: Android draws white glyphs by
 * default, which disappeared against the light surface the header paints. `style` names the
 * content, so a light theme asks for dark glyphs and a dark theme for light ones.
 */
function ThemedStack() {
  const theme = useAppTheme();
  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
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
