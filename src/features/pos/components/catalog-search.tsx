import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { SearchInput, Text } from '@beemvp/beeui-ui';
import { AppIcon } from '../../../components/icons';
import { useT } from '../../../i18n';

interface CatalogSearchProps {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Under 400 pt the long placeholder wraps, so the short one is used instead. */
  short: boolean;
  /** Desktop shows the F3 key hint and binds the key. */
  showKeyHint: boolean;
}

/**
 * Web only: F3 puts the caret in the catalog search field, per the direction doc.
 *
 * The field is found by comparing the `placeholder` property rather than by interpolating the
 * translated text into an attribute selector: a dictionary entry holding a quote would make
 * that selector a `SyntaxError` and take the shortcut down with it.
 */
function focusSearchField(placeholder: string): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  const fields = Array.from(document.querySelectorAll('input'));
  fields.find((field) => field.placeholder === placeholder)?.focus();
}

/**
 * Catalog search: 44 pt field with the barcode control on the trailing edge, sticky at the
 * top of the catalog. Scanning is the same path as typing, a scanner is a keyboard that ends
 * its input with Enter, so the barcode button exists for the accessible name and for the
 * hardware camera a later phase adds.
 */
export function CatalogSearch({ value, onChangeText, onSubmit, short, showKeyHint }: CatalogSearchProps) {
  const t = useT();
  const placeholder = short ? t('pos.searchPlaceholderShort') : t('pos.searchPlaceholder');

  useEffect(() => {
    if (!showKeyHint || Platform.OS !== 'web') return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.code !== 'F3') return;
      event.preventDefault();
      focusSearchField(placeholder);
    }
    // Capture: a BeeUI field stops keydown before it bubbles back to the window, so a
    // bubble listener never sees F3 once the caret is in any text field (see
    // `docs/beeui-audit/findings-19-review.md`).
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [placeholder, showKeyHint]);

  return (
    <View className="h-11 flex-row items-center gap-2 rounded-md border border-control-border bg-surface pr-1">
      <SearchInput
        value={value}
        onChangeText={onChangeText}
        onSearch={onSubmit}
        placeholder={placeholder}
        className="flex-1 border-0 bg-transparent"
      />
      {showKeyHint ? (
        <View className="rounded-sm border border-border px-1.5 py-0.5">
          <Text variant="caption" className="text-subtle-foreground">F3</Text>
        </View>
      ) : null}
      {/*
        Decorative, not a button: this prototype has no camera, and a control that does
        nothing when pressed is a lie about the product. The glyph says the field accepts a
        scanner, which it does, a scanner types the digits and sends Enter.
      */}
      <View className="h-10 w-10 items-center justify-center">
        <AppIcon name="scan-barcode" tone="muted-foreground" />
      </View>
    </View>
  );
}
