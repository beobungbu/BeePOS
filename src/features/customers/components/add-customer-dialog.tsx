import { useState } from 'react';
import {
  Button,
  DatePicker,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  Input,
  Textarea,
  VStack,
  type CalendarDate,
} from '@beemvp/beeui-ui';
import { isValidVnPhone } from '../../../domain/customers';
import { useT } from '../../../i18n';
import { calendarDateToIso } from '../lib/calendar-date';

export interface NewCustomerInput {
  name: string;
  phone: string;
  birthday: string | null;
  note: string;
}

export function AddCustomerDialog({
  open,
  onOpenChange,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewCustomerInput) => void;
}) {
  const t = useT();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<CalendarDate | null>(null);
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 0;
  const phoneValid = isValidVnPhone(phone);
  const canSave = nameValid && phoneValid;

  const reset = () => {
    setName('');
    setPhone('');
    setBirthday(null);
    setNote('');
    setTouched(false);
  };

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onCreate({ name: name.trim(), phone: phone.trim(), birthday: birthday ? calendarDateToIso(birthday) : null, note: note.trim() });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
      open={open}
    >
      <DialogContent>
        <DialogTitle>{t('customers.addDialog.title')}</DialogTitle>
        <VStack className="gap-4">
          <Field
            error={touched && !nameValid ? t('customers.addDialog.nameError') : undefined}
            invalid={touched && !nameValid}
            label={t('customers.addDialog.name')}
            required
          >
            <Input onChangeText={setName} placeholder={t('customers.addDialog.namePlaceholder')} value={name} />
          </Field>
          <Field
            error={touched && !phoneValid ? t('customers.addDialog.phoneError') : undefined}
            invalid={touched && !phoneValid}
            label={t('customers.addDialog.phone')}
            required
          >
            <Input
              keyboardType="phone-pad"
              onChangeText={setPhone}
              placeholder={t('customers.addDialog.phonePlaceholder')}
              value={phone}
            />
          </Field>
          <Field label={t('customers.addDialog.birthday')}>
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
          <Field label={t('customers.addDialog.note')}>
            <Textarea onChangeText={setNote} placeholder={t('customers.addDialog.notePlaceholder')} value={note} />
          </Field>
        </VStack>
        <DialogFooter>
          <Button
            onPress={() => {
              reset();
              onOpenChange(false);
            }}
            variant="outline"
          >
            {t('customers.addDialog.cancel')}
          </Button>
          <Button onPress={handleSave}>{t('customers.addDialog.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
