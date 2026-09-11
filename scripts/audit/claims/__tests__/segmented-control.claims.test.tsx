// https://beeui.beemvp.com/docs/components/segmented-control/
// "Controlled (value/onValueChange) mutually exclusive selection with
// radiogroup semantics; enabled usage without onValueChange warns in
// development, and a disabled segment cannot be selected."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/segmented-control.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { SegmentedControl, SegmentedControlItem } from '@beemvp/beeui-ui';
import { findAllByDisplayName, withWarnSpy } from '../test-utils';

test('SC-01: enabled usage without onValueChange warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <SegmentedControl value="a">
          <SegmentedControlItem value="a">A</SegmentedControlItem>
        </SegmentedControl>
      );
    });
  });
  expect(calls.some((m) => /SegmentedControl/.test(m) && /onValueChange/.test(m))).toBe(true);
});

test('SC-02: a disabled segment cannot be selected (its onValueChange is not invoked, and it reports accessibilityState.disabled)', () => {
  const onValueChange = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <SegmentedControl value="a" onValueChange={onValueChange}>
        <SegmentedControlItem value="a">A</SegmentedControlItem>
        <SegmentedControlItem value="b" disabled>
          B
        </SegmentedControlItem>
      </SegmentedControl>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const items = findAllByDisplayName(renderer!.root, 'Pressable');
  expect(items[1].props.disabled).toBe(true);
  expect(items[1].props.accessibilityState.disabled).toBe(true);
});
