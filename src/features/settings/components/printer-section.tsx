import { Button, ButtonLabel, Field, HStack, Section, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, useToast } from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { useSettingsStore } from '../../../data/settings-store';
// One list for the chain default here and the per branch override on a store's page: a branch
// naming a printer the chain list does not have would print to nothing.
import { PRINTERS } from '../lib/printers';

export function PrinterSection() {
  const t = useT();
  const toast = useToast();
  const printerId = useSettingsStore((state) => state.printerId);
  const setPrinterId = useSettingsStore((state) => state.setPrinterId);

  function handleTestPrint() {
    if (!printerId) {
      toast.show({ title: t('settings.printer.testPrintNoneToast'), variant: 'warning' });
      return;
    }
    toast.show({ title: t('settings.printer.testPrintToast'), variant: 'success' });
  }

  return (
    <Section title={t('settings.section.printer')}>
      <HStack gap="md" wrap align="end">
        <Field label={t('settings.printer.label')} className="min-w-56 flex-1">
          <Select value={printerId ?? undefined} onValueChange={setPrinterId}>
            <SelectTrigger>
              <SelectValue placeholder={t('settings.printer.none')} />
            </SelectTrigger>
            <SelectContent>
              {PRINTERS.map((printer) => (
                <SelectItem key={printer.id} value={printer.id}>
                  {printer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button variant="outline" onPress={handleTestPrint}>
          {/* `ButtonLabel` paints itself `text-primary-foreground` whatever the variant, which
              is unreadable on an outline button in dark (findings-18-w-c). */}
          <ButtonLabel className="text-foreground">{t('settings.printer.testPrint')}</ButtonLabel>
        </Button>
      </HStack>
    </Section>
  );
}
