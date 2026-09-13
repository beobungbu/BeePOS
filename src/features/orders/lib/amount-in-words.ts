/**
 * The amount in Vietnamese words, which a VAT invoice may not be printed without.
 *
 * `6.771.600` reads "Sáu triệu bảy trăm bảy mươi mốt nghìn sáu trăm đồng." and the words have
 * to agree with the figure to the dong: the written amount is the legally binding one on a
 * 01GTKT invoice, so this is arithmetic, not decoration.
 *
 * Pure and dependency-free so it can be asserted directly. Vietnamese only: the invoice form
 * itself is a Vietnamese tax document and is not translated.
 */

const DIGITS = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

/** Group scales, three digits at a time, from the units group upward. */
const SCALES = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];

/**
 * One group of three digits.
 *
 * `full` is true for every group but the most significant one: 1.050.000 has to read "một
 * triệu không trăm năm mươi nghìn", because dropping the empty hundreds would read as 1.5
 * million.
 */
function readTriple(value: number, full: boolean): string {
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const units = value % 10;
  const words: string[] = [];

  if (hundreds > 0 || full) words.push(DIGITS[hundreds], 'trăm');

  if (tens === 0) {
    // "lẻ" is the word that keeps 105 from reading as 15.
    if (units > 0 && (hundreds > 0 || full)) words.push('lẻ', DIGITS[units]);
    else if (units > 0) words.push(DIGITS[units]);
  } else if (tens === 1) {
    words.push('mười');
    // "mười lăm", never "mười năm".
    if (units === 5) words.push('lăm');
    else if (units > 0) words.push(DIGITS[units]);
  } else {
    words.push(DIGITS[tens], 'mươi');
    // After "mươi" the last digit changes shape: 1 is "mốt", 4 is "tư", 5 is "lăm".
    if (units === 1) words.push('mốt');
    else if (units === 4) words.push('tư');
    else if (units === 5) words.push('lăm');
    else if (units > 0) words.push(DIGITS[units]);
  }

  return words.join(' ');
}

/** Splits a whole number into groups of three digits, least significant first. */
function triplesOf(value: number): number[] {
  const groups: number[] = [];
  let rest = value;
  while (rest > 0) {
    groups.push(rest % 1000);
    rest = Math.floor(rest / 1000);
  }
  return groups;
}

/**
 * The number in words, without a currency. A negative amount is read as its magnitude with
 * "âm" in front; a fraction is rounded to the dong, which is the smallest unit a VAT invoice
 * can carry.
 */
export function numberInVietnameseWords(value: number): string {
  if (!Number.isFinite(value)) return DIGITS[0];
  const rounded = Math.round(Math.abs(value));
  if (rounded === 0) return DIGITS[0];

  const groups = triplesOf(rounded);
  const parts: string[] = [];
  for (let index = groups.length - 1; index >= 0; index -= 1) {
    const group = groups[index];
    if (group === 0) continue;
    const leading = index === groups.length - 1;
    parts.push(readTriple(group, !leading));
    if (SCALES[index]) parts.push(SCALES[index]);
  }

  const words = parts.join(' ').replace(/\s+/g, ' ').trim();
  return value < 0 ? `âm ${words}` : words;
}

/** Sentence case, with the currency and the full stop an invoice prints. */
export function amountInWordsVnd(value: number): string {
  const words = `${numberInVietnameseWords(value)} đồng`;
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}.`;
}
