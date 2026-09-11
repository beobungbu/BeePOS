import '../global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { BeeUIProvider } from '@beemvp/beeui-ui';
import { Stack } from 'expo-router';
import { useAppTheme } from '../src/theme/use-app-theme';

function ThemedStack() {
  useAppTheme();
  return <Stack screenOptions={{ headerShown: false }} />;
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
