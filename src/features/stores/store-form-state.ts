import { useState } from 'react';
import type { Store } from '../../domain/types';

export interface StoreFormValues {
  code: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
}

export function emptyStoreForm(): StoreFormValues {
  return { code: '', name: '', address: '', phone: '', hours: '08:00 - 21:00' };
}

export function storeToForm(store: Store, hours: string): StoreFormValues {
  return { code: store.code, name: store.name, address: store.address, phone: store.phone, hours };
}

export interface StoreFormErrors {
  code?: string;
  name?: string;
  address?: string;
  phone?: string;
}

export function validateStoreForm(values: StoreFormValues, requiredMessage: string): StoreFormErrors {
  const errors: StoreFormErrors = {};
  if (values.code.trim().length === 0) errors.code = requiredMessage;
  if (values.name.trim().length === 0) errors.name = requiredMessage;
  if (values.address.trim().length === 0) errors.address = requiredMessage;
  if (values.phone.trim().length === 0) errors.phone = requiredMessage;
  return errors;
}

/** Local editable-form state for a store, seeded from `initial` and reset when it changes. */
export function useStoreForm(initial: StoreFormValues, requiredMessage: string) {
  const [values, setValues] = useState<StoreFormValues>(initial);
  const [errors, setErrors] = useState<StoreFormErrors>({});

  function setField<K extends keyof StoreFormValues>(key: K, value: StoreFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function validate(): boolean {
    const nextErrors = validateStoreForm(values, requiredMessage);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  return { values, errors, setField, validate, reset: setValues };
}
