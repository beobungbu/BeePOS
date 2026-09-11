// https://beeui.beemvp.com/docs/components/switch/
// "Controlled native Switch (value/onValueChange); enabled usage without
// onValueChange warns in development instead of silently doing nothing."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/switch.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Switch } from '@beemvp/beeui-ui';
import { findByDisplayName, withWarnSpy } from '../test-utils';

test('SW-01: enabled usage without onValueChange warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(<Switch value={false} />);
    });
  });
  expect(calls.some((m) => /Switch/.test(m) && /onValueChange/.test(m))).toBe(true);
});

test('SW-02: disabled + no onValueChange does not warn, and sets disabled on the underlying RN Switch', () => {
  let renderer: ReturnType<typeof create>;
  const calls = withWarnSpy(() => {
    act(() => {
      renderer = create(<Switch value={false} disabled />);
    });
  });
  expect(calls.some((m) => /Switch/.test(m))).toBe(false);
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const sw = findByDisplayName(renderer!.root, 'Switch');
  expect(sw.props.disabled).toBe(true);
});
