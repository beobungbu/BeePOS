import { useState } from 'react';
import { Button, DatePicker, Field, Input, Text, Textarea, VStack, type CalendarDate } from '@beemvp/beeui-ui';
import { isValidVnPhone } from '../../../domain/customers';
import { useT } from '../../../i18n';
import { calendarDateToIso, isoToCalendarDate } from '../lib/calendar-date';

export function CustomerInfoTab({
  name: initialName,
  phone: initialPhone,
  birthday: initialBirthday,
  note: initialNote,
  onSave,
}: {
  name: string;
  phone: string;
  birthday: string | null;
  note: string;
  onSave: (input: { name: string; phone: string; birthday: string | null; note: string }) => void;
}) {
  const t = useT();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [birthday, setBirthday] = useState<CalendarDate | null>(initialBirthday ? isoToCalendarDate(initialBirthday) : null);
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);

  const nameValid = name.trim().length > 0;
  const phoneValid = isValidVnPhone(phone);

  return (
    <VStack className="gap-4">
      <Field invalid={!nameValid} label={t('customers.infoTab.name')} required>
        <Input onChangeText={setName} value={name} />
      </Field>
      <Field
        error={!phoneValid ? t('customers.addDialog.phoneError') : undefined}
        invalid={!phoneValid}
        label={t('customers.infoTab.phone')}
        required
      >
        <Input keyboardType="phone-pad" onChangeText={setPhone} value={phone} />
      </Field>
      <Field label={t('customers.infoTab.birthday')}>
        <DatePicker
          clearable
          locale="vi-VN"
          nextMonthAccessibilityLabel={t('customers.addDialog.nextMonth')}
          onValueChange={setBirthday}
          placeholder={t('customers.addDialog.selectDate')}
          previousMonthAccessibilityLabel={t('customers.addDialog.previousMonth')}
          value={birthday}
        />
      </Field>
      <Field label={t('customers.infoTab.note')}>
        <Textarea onChangeText={setNote} value={note} />
      </Field>
      <Button
        disabled={!nameValid || !phoneValid}
        onPress={() => {
          onSave({ name: name.trim(), phone: phone.trim(), birthday: birthday ? calendarDateToIso(birthday) : null, note: note.trim() });
          setSaved(true);
        }}
      >
        {t('customers.infoTab.save')}
      </Button>
      {saved && <Text tone="success">{t('customers.infoTab.saved')}</Text>}
    </VStack>
  );
}
