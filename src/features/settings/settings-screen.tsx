import { SafeArea, Screen, VStack } from '@beemvp/beeui-ui';
import { ScrollView } from 'react-native';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';
import { useDensitySync } from './hooks/use-density-sync';
import { AppearanceSection } from './components/appearance-section';
import { LanguageSection } from './components/language-section';
import { DefaultStoreSection } from './components/default-store-section';
import { ReceiptSection } from './components/receipt-section';
import { TaxSection } from './components/tax-section';
import { PaymentSection } from './components/payment-section';
import { PrinterSection } from './components/printer-section';
import { SecuritySection } from './components/security-section';
import { AuditSection } from './components/audit-section';
import { AboutSection } from './components/about-section';
import { ResetDataSection } from './components/reset-data-section';
import { LogoutSection } from './components/logout-section';

/** Form content is capped at 480 and centred at every breakpoint (direction doc section 7). */
const FORM_MAX_WIDTH = 480;
/** Page padding per band: 16 phone, 24 tablet, 32 desktop (direction doc section 7). */
const FORM_PADDING = { phone: 'p-4', tablet: 'p-6', desktop: 'p-8' } as const;

/**
 * `useDensitySync` is called here (not in `app/_layout.tsx`, which phase 0 owns) so density
 * still applies app-wide once set, since Uniwind's density CSS variables are global once
 * `applyDensity` runs. This screen just owns the one call site that triggers it.
 */
export function SettingsScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  useDensitySync();
  useScreenHeader({ title: t('common.nav.settings') });

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        {/* `Screen` owns no scroll behaviour, so the nine setting groups need one here. */}
        <ScrollView className="flex-1">
          <VStack
            gap="lg"
            className={`w-full self-center ${FORM_PADDING[breakpoint]}`}
            style={{ maxWidth: FORM_MAX_WIDTH }}
          >
            <AppearanceSection />
            <LanguageSection />
            <DefaultStoreSection />
            <ReceiptSection />
            <TaxSection />
            <PaymentSection />
            <PrinterSection />
            <SecuritySection />
            <AuditSection />
            <AboutSection />
            <ResetDataSection />
            <LogoutSection />
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}
