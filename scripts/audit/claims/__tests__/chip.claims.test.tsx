// https://beeui.beemvp.com/docs/components/chip/
// "Standalone toggle (selected/onSelectedChange) or, nested in ChipGroup, a
// value-scoped selection item; a grouped Chip rendered without a value
// fails safe as disabled and warns in development, and ChipGroup supports
// controlled/uncontrolled single- or multiple-selection."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/chip.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Chip, ChipGroup } from '@beemvp/beeui-ui';
import { findByDisplayName, findAllByDisplayName, withWarnSpy } from '../test-utils';

test('CHIP-01: a grouped Chip without a value fails safe as disabled', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <ChipGroup>
        {/* @ts-expect-error deliberately omitting the required `value` to test the documented fail-safe */}
        <Chip>Untagged</Chip>
      </ChipGroup>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.disabled).toBe(true);
  expect(pressable.props.accessibilityState.disabled).toBe(true);
});

test('CHIP-02: a grouped Chip without a value warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <ChipGroup>
          {/* @ts-expect-error deliberately omitting the required `value` to test the documented fail-safe */}
          <Chip>Untagged</Chip>
        </ChipGroup>
      );
    });
  });
  expect(calls.some((m) => /Chip/.test(m) && /value/.test(m))).toBe(true);
});

test('CHIPGROUP-01: uncontrolled ChipGroup single-selection reflects the pressed Chip as selected', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <ChipGroup>
        <Chip value="a">A</Chip>
        <Chip value="b">B</Chip>
      </ChipGroup>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let chips = findAllByDisplayName(renderer!.root, 'Pressable');
  act(() => {
    (chips[1].props.onPress as (e: unknown) => void)({});
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  chips = findAllByDisplayName(renderer!.root, 'Pressable');
  expect(chips[0].props.accessibilityState.checked).toBe(false);
  expect(chips[1].props.accessibilityState.checked).toBe(true);
});

test('CHIPGROUP-02: controlled ChipGroup selection state is driven by the `value` prop, not internal state', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <ChipGroup value="a" onValueChange={() => {}}>
        <Chip value="a">A</Chip>
        <Chip value="b">B</Chip>
      </ChipGroup>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chips = findAllByDisplayName(renderer!.root, 'Pressable');
  act(() => {
    (chips[1].props.onPress as (e: unknown) => void)({});
  });
  // A controlled ChipGroup does not update its own visible selection from a
  // press alone — only a re-render with a new `value` prop would.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const chipsAfter = findAllByDisplayName(renderer!.root, 'Pressable');
  expect(chipsAfter[0].props.accessibilityState.checked).toBe(true);
  expect(chipsAfter[1].props.accessibilityState.checked).toBe(false);
});
