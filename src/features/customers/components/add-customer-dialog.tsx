import { useState } from 'react';
import { ScrollView } from 'react-native';
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
import type { Customer, CustomerGroup, Staff } from '../../../domain/types';
import { useT } from '../../../i18n';
import { calendarDateToIso } from '../lib/calendar-date';
import {
  businessPatchOf,
  CustomerBusinessFields,
  EMPTY_BUSINESS_DRAFT,
  type CustomerBusinessDraft,
} from './customer-business-fields';

export interface NewCustomerInput {
  name: string;
  phone: string;
  birthday: string | null;
  note: string;
  /** Type, company fields, group, rep, limit and term, ready to spread onto a `Customer`. */
  business: Partial<Customer>;
}

/**
 * One dialog for both shapes of customer: the type control decides which fields it shows, so
 * a company account is created here rather than being created retail and edited afterwards.
 * The body scrolls because the company form is taller than a phone dialog.
 */
export function AddCustomerDialog({
  open,
  onOpenChange,
  onCreate,
  groups,
  reps,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (input: NewCustomerInput) => void;
  groups: CustomerGroup[];
  reps: Staff[];
}) {
  const t = useT();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState<CalendarDate | null>(null);
  const [note, setNote] = useState('');
  const [business, setBusiness] = useState<CustomerBusinessDraft>(EMPTY_BUSINESS_DRAFT);
  const [touched, setTouched] = useState(false);

  const nameValid = name.trim().length > 0;
  const phoneValid = isValidVnPhone(phone);
  const canSave = nameValid && phoneValid;

  const reset = () => {
    setName('');
    setPhone('');
    setBirthday(null);
    setNote('');
    setBusiness(EMPTY_BUSINESS_DRAFT);
    setTouched(false);
  };

  const handleSave = () => {
    setTouched(true);
    if (!canSave) return;
    onCreate({
      name: name.trim(),
      phone: phone.trim(),
      birthday: birthday ? calendarDateToIso(birthday) : null,
      note: note.trim(),
      business: businessPatchOf(business),
    });
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
        <ScrollView className="max-h-[420px]">
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

            <CustomerBusinessFields
              value={business}
              onChange={setBusiness}
              groups={groups}
              reps={reps}
            />

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
        </ScrollView>
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
