// https://beeui.beemvp.com/docs/components/checkbox/
// "Controlled boolean/indeterminate checked/onCheckedChange checkbox;
// enabling it without onCheckedChange warns in development instead of
// silently doing nothing, and disabled blocks both press handling and the
// accessibility toggle action."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/checkbox.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Checkbox } from '@beemvp/beeui-ui';
import { findByDisplayName, withWarnSpy } from '../test-utils';

function renderCheckbox(props: Record<string, unknown>) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Checkbox {...props} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return renderer!;
}

test('CHK-01: enabled usage (checked, no disabled) without onCheckedChange warns in development', () => {
  const calls = withWarnSpy(() => {
    renderCheckbox({ checked: false });
  });
  expect(calls.some((m) => /Checkbox/.test(m) && /onCheckedChange/.test(m))).toBe(true);
});

test('CHK-02: disabled + no onCheckedChange does not warn (interaction is intentionally read-only)', () => {
  const calls = withWarnSpy(() => {
    renderCheckbox({ checked: false, disabled: true });
  });
  expect(calls.some((m) => /Checkbox/.test(m))).toBe(false);
});

test('CHK-03: disabled blocks press handling (Pressable receives disabled=true)', () => {
  const renderer = renderCheckbox({ checked: false, disabled: true, onCheckedChange: () => {} });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.disabled).toBe(true);
});

test('CHK-04: disabled marks the accessibility toggle action disabled', () => {
  const renderer = renderCheckbox({ checked: false, disabled: true, onCheckedChange: () => {} });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.accessibilityState.disabled).toBe(true);
});

test('CHK-05: checked=true reflects accessibilityState.checked === true', () => {
  const renderer = renderCheckbox({ checked: true, onCheckedChange: () => {} });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.accessibilityState.checked).toBe(true);
});

test("CHK-06: checked='indeterminate' reflects accessibilityState.checked === 'mixed'", () => {
  const renderer = renderCheckbox({ checked: 'indeterminate', onCheckedChange: () => {} });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.accessibilityState.checked).toBe('mixed');
});
