/**
 * Merge point for i18n dictionaries. Phase 0 owns `common`; later phases register their
 * own `<area>.vi.ts` / `<area>.en.ts` namespace without ever editing this file or index.ts.
 */

export type Locale = 'vi' | 'en';
export type DictionaryEntries = Record<string, unknown>;

const dictionaries: Record<Locale, Record<string, DictionaryEntries>> = { vi: {}, en: {} };

/** Registers (or merges into) a namespace within a locale's dictionary. Idempotent. */
export function registerDictionary(locale: Locale, namespace: string, entries: DictionaryEntries): void {
  dictionaries[locale][namespace] = { ...dictionaries[locale][namespace], ...entries };
}

/** Returns the full merged dictionary tree for a locale, keyed by namespace. */
export function getDictionary(locale: Locale): Record<string, DictionaryEntries> {
  return dictionaries[locale];
}
