import { SafeArea, Screen, Text, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../i18n';
import { useDensitySync } from './hooks/use-density-sync';
import { AppearanceSection } from './components/appearance-section';
import { LanguageSection } from './components/language-section';
import { DefaultStoreSection } from './components/default-store-section';
import { ReceiptSection } from './components/receipt-section';
import { TaxSection } from './components/tax-section';
import { PaymentSection } from './components/payment-section';
import { PrinterSection } from './components/printer-section';
import { AboutSection } from './components/about-section';
import { LogoutSection } from './components/logout-section';

/**
 * `useDensitySync` is called here (not in `app/_layout.tsx`, which phase 0 owns) so density
 * still applies app-wide once set, since Uniwind's density CSS variables are global once
 * `applyDensity` runs — this screen just owns the one call site that triggers it.
 */
export function SettingsScreen() {
  const t = useT();
  useDensitySync();

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <VStack gap="lg" className="flex-1 p-6">
          <Text className="text-xl font-semibold text-foreground">{t('common.nav.settings')}</Text>

          <AppearanceSection />
          <LanguageSection />
          <DefaultStoreSection />
          <ReceiptSection />
          <TaxSection />
          <PaymentSection />
          <PrinterSection />
          <AboutSection />
          <LogoutSection />
        </VStack>
      </SafeArea>
    </Screen>
  );
}
