import {
  Screen,
  SafeArea,
  Field,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@beemvp/beeui-ui';
import { useT } from '../../../src/i18n';
import { useSettingsStore, type Locale, type ThemeMode } from '../../../src/data/settings-store';

export default function SettingsScreen() {
  const t = useT();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);

  return (
    <Screen>
      <SafeArea className="flex-1 gap-6 px-6 pt-8" edges={['bottom', 'left', 'right']}>
        <Text className="text-xl font-semibold text-foreground">{t('common.nav.settings')}</Text>

        <Field label={t('common.shell.theme')}>
          <SegmentedControl value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <SegmentedControlItem value="light">{t('common.shell.themeLight')}</SegmentedControlItem>
            <SegmentedControlItem value="dark">{t('common.shell.themeDark')}</SegmentedControlItem>
            <SegmentedControlItem value="system">{t('common.shell.themeSystem')}</SegmentedControlItem>
          </SegmentedControl>
        </Field>

        <Field label={t('common.shell.language')}>
          <Select value={locale} onValueChange={(value) => setLocale(value as Locale)}>
            <SelectTrigger>
              <SelectValue placeholder={t('common.shell.language')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vi">Tiếng Việt</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </SafeArea>
    </Screen>
  );
}
