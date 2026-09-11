import { Field, Section, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore, type Locale } from '../../../data/settings-store';

export function LanguageSection() {
  const t = useT();
  const locale = useSettingsStore((state) => state.locale);
  const setLocale = useSettingsStore((state) => state.setLocale);

  return (
    <Section title={t('settings.section.language')}>
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
    </Section>
  );
}
