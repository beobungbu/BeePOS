import { useSettingsStore } from '../data/settings-store';
import { getDictionary, type Locale } from './registry';
import './common.vi';
import './common.en';

export type { Locale } from './registry';
export { registerDictionary } from './registry';

function resolvePath(source: unknown, path: string[]): unknown {
  return path.reduce<unknown>((node, segment) => {
    if (node && typeof node === 'object' && segment in node) {
      return (node as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

/** Translates a dot path like "common.nav.pos" against the given locale's dictionary. */
export function t(key: string, locale: Locale): string {
  const [namespace, ...rest] = key.split('.');
  const dictionary = getDictionary(locale);
  const value = resolvePath(dictionary[namespace], rest);
  return typeof value === 'string' ? value : key;
}

/** Hook returning a translate function bound to the current locale from settings. */
export function useT(): (key: string) => string {
  const locale = useSettingsStore((state) => state.locale);
  return (key: string) => t(key, locale);
}
