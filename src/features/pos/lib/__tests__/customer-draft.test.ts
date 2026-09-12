import { normalisePhone, validateCustomerDraft } from '../customer-draft';

describe('normalisePhone', () => {
  it('keeps digits only so spacing never creates a duplicate', () => {
    expect(normalisePhone('090 123 4567')).toBe('0901234567');
    expect(normalisePhone('090-123.4567')).toBe('0901234567');
  });
});

describe('validateCustomerDraft', () => {
  const existing = ['0901234567'];

  it('accepts a name and a 10 digit number', () => {
    expect(validateCustomerDraft({ name: 'Chị Lan', phone: '0912345678' }, existing)).toBeUndefined();
  });

  it('accepts the 9 and 11 digit ends of the range', () => {
    expect(validateCustomerDraft({ name: 'A', phone: '091234567' }, existing)).toBeUndefined();
    expect(validateCustomerDraft({ name: 'A', phone: '09123456789' }, existing)).toBeUndefined();
  });

  it('rejects a blank name before looking at the phone', () => {
    expect(validateCustomerDraft({ name: '   ', phone: '0912345678' }, existing)).toBe('errorName');
  });

  it('rejects a number outside 9 to 11 digits', () => {
    expect(validateCustomerDraft({ name: 'A', phone: '09123456' }, existing)).toBe('errorPhone');
    expect(validateCustomerDraft({ name: 'A', phone: '091234567890' }, existing)).toBe('errorPhone');
    expect(validateCustomerDraft({ name: 'A', phone: '' }, existing)).toBe('errorPhone');
  });

  it('rejects a number another customer already has, however it is spaced', () => {
    expect(validateCustomerDraft({ name: 'A', phone: '090 123 4567' }, existing)).toBe('errorPhoneTaken');
  });
});
