/**
 * Validation for the quick-add customer form in the cart's customer dialog. Pure so the
 * rules (a name, a plausible Vietnamese phone number, no duplicate) are testable without a
 * dialog, and so the dialog only has to render the message the dictionary carries.
 */

export interface CustomerDraft {
  name: string;
  phone: string;
}

/** Which rule failed, as a dictionary suffix under `pos.customerDialog`. */
export type CustomerDraftError = 'errorName' | 'errorPhone' | 'errorPhoneTaken';

export const PHONE_MIN_DIGITS = 9;
export const PHONE_MAX_DIGITS = 11;

/**
 * The comparable form of a phone number: digits only, so `090 123 4567` and `0901234567`
 * are the same customer and a cashier's spacing never creates a duplicate record.
 */
export function normalisePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** The first broken rule, or `undefined` when the draft can be created. */
export function validateCustomerDraft(
  draft: CustomerDraft,
  existingPhones: string[],
): CustomerDraftError | undefined {
  if (draft.name.trim().length === 0) return 'errorName';

  const digits = normalisePhone(draft.phone);
  if (digits.length < PHONE_MIN_DIGITS || digits.length > PHONE_MAX_DIGITS) return 'errorPhone';

  const taken = existingPhones.some((phone) => normalisePhone(phone) === digits);
  return taken ? 'errorPhoneTaken' : undefined;
}
