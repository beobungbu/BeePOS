import { Field, Section, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SegmentedControl, SegmentedControlItem, VStack } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore, type Density, type ThemeMode } from '../../../data/settings-store';

export function AppearanceSection() {
  const t = useT();
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const density = useSettingsStore((state) => state.density);
  const setDensity = useSettingsStore((state) => state.setDensity);

  return (
    <Section title={t('settings.section.appearance')}>
      <VStack gap="md">
        <Field label={t('common.shell.theme')}>
          <SegmentedControl value={theme} onValueChange={(value) => setTheme(value as ThemeMode)}>
            <SegmentedControlItem value="light">{t('common.shell.themeLight')}</SegmentedControlItem>
            <SegmentedControlItem value="dark">{t('common.shell.themeDark')}</SegmentedControlItem>
            <SegmentedControlItem value="system">{t('common.shell.themeSystem')}</SegmentedControlItem>
          </SegmentedControl>
        </Field>

        <Field label={t('settings.density.label')}>
          <Select value={density} onValueChange={(value) => setDensity(value as Density)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">{t('settings.density.comfortable')}</SelectItem>
              <SelectItem value="compact">{t('settings.density.compact')}</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </VStack>
    </Section>
  );
}
