import { formatMoneyDraft, moneyDigits, nextMoneyDigits } from '../money-draft';

describe('moneyDigits', () => {
  it('keeps digits only', () => {
    expect(moneyDigits('200.000 đ')).toBe('200000');
    expect(moneyDigits('abc')).toBe('');
  });

  it('drops the leading zeros a keypad produces', () => {
    expect(moneyDigits('0200000')).toBe('200000');
    expect(moneyDigits('0')).toBe('0');
  });

  it('caps the amount at twelve digits', () => {
    expect(moneyDigits('1234567890123456')).toBe('123456789012');
  });
});

describe('formatMoneyDraft', () => {
  it('groups the amount and carries the unit', () => {
    expect(formatMoneyDraft('200000')).toBe(formatMoneyDraft('200000'));
    expect(formatMoneyDraft('200000')).toMatch(/^200\.000\s?đ$/);
  });

  it('is empty while nothing has been typed', () => {
    expect(formatMoneyDraft('')).toBe('');
  });
});

describe('nextMoneyDigits', () => {
  it('appends a digit typed after the formatted value', () => {
    expect(nextMoneyDigits('20000', '20.000 đ0')).toBe('200000');
  });

  it('treats the first backspace on the unit suffix as deleting a digit', () => {
    // "200.000 đ" minus its last character still yields 200000, so the delete has to bite.
    expect(nextMoneyDigits('200000', '200.000 ')).toBe('20000');
    expect(nextMoneyDigits('5', '')).toBe('');
  });

  it('takes a pasted or programmatically filled amount as typed', () => {
    expect(nextMoneyDigits('', '500000')).toBe('500000');
    expect(nextMoneyDigits('500000', '1.000.000 đ')).toBe('1000000');
  });
});
