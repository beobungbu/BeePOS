import { useState } from 'react';
import { Button, DatePicker, Field, Input, Text, Textarea, VStack, type CalendarDate } from '@beemvp/beeui-ui';
import { isValidVnPhone } from '../../../domain/customers';
import type { Customer, CustomerGroup, Staff } from '../../../domain/types';
import { useT } from '../../../i18n';
import { calendarDateToIso, isoToCalendarDate } from '../lib/calendar-date';
import {
  businessDraftOf,
  businessPatchOf,
  CustomerBusinessFields,
  type CustomerBusinessDraft,
} from './customer-business-fields';

export interface CustomerInfoSave {
  name: string;
  phone: string;
  birthday: string | null;
  note: string;
  business: Partial<Customer>;
}

export function CustomerInfoTab({
  customer,
  birthday: initialBirthday,
  note: initialNote,
  groups,
  reps,
  onSave,
}: {
  customer: Customer;
  birthday: string | null;
  note: string;
  groups: CustomerGroup[];
  reps: Staff[];
  onSave: (input: CustomerInfoSave) => void;
}) {
  const t = useT();
  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone);
  const [birthday, setBirthday] = useState<CalendarDate | null>(initialBirthday ? isoToCalendarDate(initialBirthday) : null);
  const [note, setNote] = useState(initialNote);
  const [business, setBusiness] = useState<CustomerBusinessDraft>(() => businessDraftOf(customer));
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

      <CustomerBusinessFields value={business} onChange={setBusiness} groups={groups} reps={reps} />

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
          onSave({
            name: name.trim(),
            phone: phone.trim(),
            birthday: birthday ? calendarDateToIso(birthday) : null,
            note: note.trim(),
            business: businessPatchOf(business),
          });
          setSaved(true);
        }}
      >
        {t('customers.infoTab.save')}
      </Button>
      {saved && <Text tone="success">{t('customers.infoTab.saved')}</Text>}
    </VStack>
  );
}
