import { Field, Section, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore } from '../../../data/settings-store';
import { useOrgStore } from '../../../data/org-store';

export function DefaultStoreSection() {
  const t = useT();
  const stores = useOrgStore((state) => state.stores);
  const defaultStoreId = useSettingsStore((state) => state.defaultStoreId);
  const setDefaultStoreId = useSettingsStore((state) => state.setDefaultStoreId);

  return (
    <Section title={t('settings.section.defaultStore')}>
      <Field label={t('settings.defaultStore.label')}>
        <Select
          value={defaultStoreId ?? undefined}
          onValueChange={(value) => setDefaultStoreId(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('reports.storeFilter.all')} />
          </SelectTrigger>
          <SelectContent>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </Section>
  );
}
