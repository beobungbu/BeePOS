import { useState } from 'react';
import type { Staff, StaffRole } from '../../domain/types';

export interface StaffFormValues {
  name: string;
  phone: string;
  role: StaffRole;
  storeIds: string[];
  active: boolean;
}

export function emptyStaffForm(defaultStoreId?: string): StaffFormValues {
  return { name: '', phone: '', role: 'cashier', storeIds: defaultStoreId ? [defaultStoreId] : [], active: true };
}

export function staffToForm(member: Staff, active: boolean): StaffFormValues {
  return { name: member.name, phone: '', role: member.role, storeIds: member.storeIds, active };
}

export interface StaffFormErrors {
  name?: string;
  storeIds?: string;
}

export function validateStaffForm(values: StaffFormValues, requiredMessage: string): StaffFormErrors {
  const errors: StaffFormErrors = {};
  if (values.name.trim().length === 0) errors.name = requiredMessage;
  if (values.storeIds.length === 0) errors.storeIds = requiredMessage;
  return errors;
}

/** Local editable-form state for a staff member. */
export function useStaffForm(initial: StaffFormValues, requiredMessage: string) {
  const [values, setValues] = useState<StaffFormValues>(initial);
  const [errors, setErrors] = useState<StaffFormErrors>({});

  function setField<K extends keyof StaffFormValues>(key: K, value: StaffFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleStore(storeId: string, checked: boolean) {
    setValues((prev) => ({
      ...prev,
      storeIds: checked ? [...prev.storeIds, storeId] : prev.storeIds.filter((id) => id !== storeId),
    }));
  }

  function validate(): boolean {
    const nextErrors = validateStaffForm(values, requiredMessage);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return { values, errors, setField, toggleStore, validate };
}
