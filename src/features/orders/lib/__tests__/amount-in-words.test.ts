import { amountInWordsVnd, numberInVietnameseWords } from '../amount-in-words';

describe('numberInVietnameseWords', () => {
  it('reads the invoice total of the commerce mockup exactly', () => {
    expect(numberInVietnameseWords(6_771_600)).toBe(
      'sáu triệu bảy trăm bảy mươi mốt nghìn sáu trăm',
    );
  });

  it('reads zero and single digits', () => {
    expect(numberInVietnameseWords(0)).toBe('không');
    expect(numberInVietnameseWords(5)).toBe('năm');
  });

  it('uses "lẻ" so 105 cannot be read as 15', () => {
    expect(numberInVietnameseWords(105)).toBe('một trăm lẻ năm');
    expect(numberInVietnameseWords(15)).toBe('mười lăm');
  });

  it('changes the last digit after "mươi"', () => {
    expect(numberInVietnameseWords(21)).toBe('hai mươi mốt');
    expect(numberInVietnameseWords(24)).toBe('hai mươi tư');
    expect(numberInVietnameseWords(25)).toBe('hai mươi lăm');
    expect(numberInVietnameseWords(20)).toBe('hai mươi');
  });

  it('keeps an empty hundreds group in a non-leading triple', () => {
    // Dropping "không trăm" here would read as one and a half million.
    expect(numberInVietnameseWords(1_050_000)).toBe('một triệu không trăm năm mươi nghìn');
  });

  it('skips a group that is entirely zero', () => {
    expect(numberInVietnameseWords(1_000_500)).toBe('một triệu năm trăm');
    expect(numberInVietnameseWords(2_000_000)).toBe('hai triệu');
  });

  it('reads billions', () => {
    expect(numberInVietnameseWords(1_234_567_890)).toBe(
      'một tỷ hai trăm ba mươi tư triệu năm trăm sáu mươi bảy nghìn tám trăm chín mươi',
    );
  });

  it('rounds to the dong and marks a negative amount', () => {
    expect(numberInVietnameseWords(1_000.4)).toBe('một nghìn');
    expect(numberInVietnameseWords(-2_000)).toBe('âm hai nghìn');
  });
});

describe('amountInWordsVnd', () => {
  it('is sentence cased, carries the currency and ends the sentence', () => {
    expect(amountInWordsVnd(6_771_600)).toBe(
      'Sáu triệu bảy trăm bảy mươi mốt nghìn sáu trăm đồng.',
    );
  });
});
