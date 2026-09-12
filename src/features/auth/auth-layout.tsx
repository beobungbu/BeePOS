import { View } from 'react-native';
import { SafeArea, Screen, Text } from '@beemvp/beeui-ui';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { BrandMark } from '../../components/shell/brand-mark';

/** Version line in the auth footer; kept in step with `package.json` when either bumps. */
export const APP_VERSION = '0.1.0';
export const BEEUI_VERSION = '0.86.2-rc.1';

/**
 * Shared frame for `/login` and the wide `/select-store`: content centred, capped at 480,
 * page padding by breakpoint. From 768 up the form sits in a card on a muted page, which is
 * the only thing that changes across widths.
 */
export function AuthLayout({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  const boxed = useBreakpoint() !== 'phone';

  return (
    <Screen>
      <SafeArea
        className={`flex-1 ${boxed ? 'bg-surface-muted' : 'bg-background'}`}
        edges={['top', 'bottom', 'left', 'right']}
      >
        {/* The page gutter sits on this View, not on `SafeArea`: `SafeArea` resolves its own
            horizontal padding from the insets and drops the horizontal padding it is given, which is what
            left the phone login flush against both edges (findings-15-polish, 15-01). */}
        <View className="flex-1 items-center justify-center gap-6 px-4 py-6">
          <View
            className={`w-full max-w-[480px] gap-4 ${
              boxed ? 'rounded-lg border border-border bg-surface p-8' : ''
            }`}
          >
            {children}
          </View>
          {footer}
        </View>
      </SafeArea>
    </Screen>
  );
}

/** Brand block: amber mark, wordmark or greeting, one supporting line. */
export function AuthBrand({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View className="mb-2 items-center gap-0.5">
      <BrandMark size="lg" />
      <Text variant="title" className="mt-3.5 font-bold text-foreground">{title}</Text>
      <Text variant="label" className="font-normal text-muted-foreground">{subtitle}</Text>
    </View>
  );
}

/** `BeePOS 0.1.0 · BeeUI 0.86.2-rc.1` under the card. */
export function AuthFooter() {
  return (
    <Text variant="caption" className="text-subtle-foreground">
      {`BeePOS ${APP_VERSION} · BeeUI ${BEEUI_VERSION}`}
    </Text>
  );
}
