/**
 * The promotion editor's form: strings in the fields, a `Promotion` on save.
 *
 * Dates are held as `dd/mm/yyyy` text because that is what a Vietnamese shop owner types and
 * what the mockup shows; parsing happens once, here, so no screen has to guess a format.
 */

import { useState } from 'react';
import type { Promotion, PromotionType } from '../../../domain/types';
import type { PromotionScope } from './promotion-status';
import { promotionScope } from './promotion-status';

export interface PromotionFormValues {
  name: string;
  type: PromotionType;
  /** Percent for `percent`, dong per unit for `amount`, unused for `buy_x_get_y`. */
  value: string;
  buyQty: string;
  getQty: string;
  scope: PromotionScope;
  productIds: string[];
  categoryIds: string[];
  /** Empty means every branch. */
  storeIds: string[];
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  stackable: boolean;
}

export interface PromotionFormErrors {
  name?: string;
  value?: string;
  buyQty?: string;
  scope?: string;
  window?: string;
}

const DATE_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/** `dd/mm/yyyy` to a UTC date, or `null` when the text is not a real day. */
export function parseFormDate(text: string): Date | null {
  const match = DATE_PATTERN.exec(text.trim());
  if (!match) return null;
  const [, day, month, year] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() !== Number(month) - 1) return null;
  return date;
}

export function formatFormDate(date: Date): string {
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

export function emptyPromotionForm(now: Date): PromotionFormValues {
  const inAMonth = new Date(now.getTime() + 30 * 86_400_000);
  return {
    name: '',
    type: 'percent',
    value: '10',
    buyQty: '2',
    getQty: '1',
    scope: 'all',
    productIds: [],
    categoryIds: [],
    storeIds: [],
    startsAt: formatFormDate(now),
    endsAt: formatFormDate(inAMonth),
    isActive: true,
    stackable: false,
  };
}

export function promotionToForm(promotion: Promotion): PromotionFormValues {
  return {
    name: promotion.name,
    type: promotion.type,
    value: String(promotion.value),
    buyQty: String(promotion.buyQty ?? 2),
    getQty: String(promotion.getQty ?? 1),
    scope: promotionScope(promotion),
    productIds: promotion.productIds ?? [],
    categoryIds: promotion.categoryIds ?? [],
    storeIds: promotion.storeIds ?? [],
    startsAt: formatFormDate(promotion.startsAt),
    endsAt: formatFormDate(promotion.endsAt),
    isActive: promotion.isActive,
    stackable: promotion.stackable,
  };
}

export interface PromotionValidationMessages {
  required: string;
  positive: string;
  scope: string;
  window: string;
}

export function validatePromotionForm(
  values: PromotionFormValues,
  messages: PromotionValidationMessages,
): PromotionFormErrors {
  const errors: PromotionFormErrors = {};
  if (values.name.trim().length === 0) errors.name = messages.required;

  if (values.type === 'buy_x_get_y') {
    if (Number(values.buyQty) <= 0 || Number(values.getQty) <= 0) errors.buyQty = messages.positive;
  } else if (!(Number(values.value) > 0)) {
    errors.value = messages.positive;
  }

  if (values.scope === 'products' && values.productIds.length === 0) errors.scope = messages.scope;
  if (values.scope === 'categories' && values.categoryIds.length === 0) errors.scope = messages.scope;

  const start = parseFormDate(values.startsAt);
  const end = parseFormDate(values.endsAt);
  if (!start || !end || end.getTime() < start.getTime()) errors.window = messages.window;

  return errors;
}

/**
 * The record the form describes. `id` and `orgId` come from the caller: a new programme gets a
 * fresh id, an edit keeps the one it had.
 */
export function formToPromotion(
  values: PromotionFormValues,
  identity: { id: string; orgId: string },
): Promotion {
  const start = parseFormDate(values.startsAt) ?? new Date();
  const end = parseFormDate(values.endsAt) ?? start;
  // The window is inclusive of its last day: a programme that ends on the 30th runs until the
  // 30th closes, not until it opens.
  const endOfDay = new Date(end.getTime() + 86_400_000 - 1);

  return {
    id: identity.id,
    orgId: identity.orgId,
    name: values.name.trim(),
    type: values.type,
    value: values.type === 'buy_x_get_y' ? 0 : Number(values.value),
    buyQty: values.type === 'buy_x_get_y' ? Number(values.buyQty) : undefined,
    getQty: values.type === 'buy_x_get_y' ? Number(values.getQty) : undefined,
    productIds: values.scope === 'products' ? values.productIds : undefined,
    categoryIds: values.scope === 'categories' ? values.categoryIds : undefined,
    storeIds: values.storeIds.length > 0 ? values.storeIds : undefined,
    startsAt: start,
    endsAt: endOfDay,
    isActive: values.isActive,
    stackable: values.stackable,
  };
}

/** Local editable-form state, re-seeded whenever the caller selects another promotion. */
export function usePromotionForm(initial: PromotionFormValues, key: string) {
  const [values, setValues] = useState<PromotionFormValues>(initial);
  const [errors, setErrors] = useState<PromotionFormErrors>({});
  const [seededKey, setSeededKey] = useState(key);

  // Selecting another row in the list replaces the form. Adjusted during render rather than in
  // an effect, which is React's own answer to "reset state when a prop changes": an effect
  // would paint the previous promotion's values for one frame first.
  if (key !== seededKey) {
    setSeededKey(key);
    setValues(initial);
    setErrors({});
  }

  function setField<K extends keyof PromotionFormValues>(field: K, value: PromotionFormValues[K]) {
    setValues((previous) => ({ ...previous, [field]: value }));
  }

  function toggleInList(field: 'productIds' | 'categoryIds' | 'storeIds', id: string) {
    setValues((previous) => {
      const list = previous[field];
      return {
        ...previous,
        [field]: list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id],
      };
    });
  }

  function validate(messages: PromotionValidationMessages): boolean {
    const next = validatePromotionForm(values, messages);
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  return { values, errors, setField, toggleInList, validate };
}
