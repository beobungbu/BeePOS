# Findings 19 · phase 5 wave 2 code review (W-R)

### 19-01 · A focused Input/SearchInput stops `keydown` from bubbling, so every app-level keyboard shortcut dies while the caret is in a field
- Area: web-runtime
- Severity: major
- Source consulted: https://beeui.beemvp.com/docs/components/input, `llms-components.txt` (`Input`, `SearchInput`), `@beemvp/beeui-ui@0.86.2-rc.1`
- Expected (per docs): nothing in the `Input` / `SearchInput` documentation says the component consumes key events. An app that installs a global `keydown` listener for `F3`, `F9`, `Alt+N` or `Cmd+K` reasonably expects to receive them whatever has focus, as it would with a plain `<input>`.
- Actual: while a BeeUI field holds focus, `keydown` reaches the **capture** phase only. The bubble phase never gets back to `document` or `window`, so every bubble-phase listener is silently deaf. A plain `<input>` appended to the same document bubbles normally, so it is the component, not the browser or react-native-web's event plugin in general.
- Repro (BeePOS on web, caret in the POS catalogue search):
  ```js
  window.addEventListener('keydown', () => console.log('bubble'), false);
  window.addEventListener('keydown', () => console.log('capture'), true);
  // typing into a BeeUI SearchInput logs only "capture"; a plain <input> logs both
  ```
- Workaround: register app shortcuts with `{ capture: true }` and do the "is the user typing" test in the handler (`isTypingTarget` in `src/lib/keyboard.ts`). Applied in `catalog-search.tsx`, `cart-panel.tsx`, `order-tab-strip.tsx`, `order-filters-bar.tsx` and `shell/overlay-store.ts`.
- Suggested fix for BeeUI: do not call `stopPropagation()` on `keydown` from the field, or document the behaviour and expose an opt-out prop. Swallowing keys that the component does not handle costs any consuming app its entire keyboard model, and the failure is silent.

### 19-02 · `Dialog` renders two nested `role="dialog"` nodes, so `getByRole('dialog')` is ambiguous
- Area: a11y
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/dialog
- Expected (per docs): one dialog node per open `Dialog`.
- Actual: an open `Dialog` produces an outer `div[role="dialog"][aria-modal="true"]` (the overlay/positioner) wrapping the labelled `div[role="dialog"][aria-modal="true"]` that holds the content. Playwright's `getByRole('dialog')` is a strict-mode violation unless a name is given, and a screen reader is told it has entered two modals.
- Repro: open any `Dialog`, then `document.querySelectorAll('[role="dialog"]').length` is 2.
- Workaround: always query by accessible name (`getByRole('dialog', { name: 'Tìm nhanh' })`); `isOverlayOpen()` in `src/lib/keyboard.ts` only tests for presence, so the duplication is harmless there.
- Suggested fix for BeeUI: the positioner should be a plain element; only the content node should carry `role="dialog"` and `aria-modal`.

### 19-03 · `SearchInput` exposes no imperative focus handle
- Area: gap
- Severity: minor
- Source consulted: https://beeui.beemvp.com/docs/components/search-input
- Expected (per docs): a focusable control accepts a `ref` that can focus it, like `TextInput`.
- Actual: no `ref` forwarding and no `focus()` method, so the three places that implement a "focus the search" shortcut (`F3` on the POS and on `/orders`, `Cmd+K` in the palette) each reach into the DOM instead: two wrap the field in a `View nativeID=...` and query it, the third had to match on the translated `placeholder` attribute.
- Repro: `const ref = useRef(null); <SearchInput ref={ref} />; ref.current?.focus()` does nothing.
- Workaround: wrapper `nativeID` plus `document.getElementById(id).querySelector('input')`.
- Suggested fix for BeeUI: forward the ref to the underlying `TextInput`, or accept an `autoFocus`/`focusKey` prop.
