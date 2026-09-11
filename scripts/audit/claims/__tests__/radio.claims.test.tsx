// https://beeui.beemvp.com/docs/components/radio/
// "Standalone Radio supports both selection and deselection through
// onCheckedChange; grouped through RadioGroup (value/onValueChange, fully
// controlled — there is no uncontrolled mode) radios become mutually
// exclusive and can no longer deselect. Enabled usage without the matching
// callback warns in development."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/radio.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Radio, RadioGroup } from '@beemvp/beeui-ui';
import { findByDisplayName, findAllByDisplayName, withWarnSpy } from '../test-utils';

test('RG-01: enabled RadioGroup usage without onValueChange warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <RadioGroup value="a">
          <Radio value="a" />
        </RadioGroup>
      );
    });
  });
  expect(calls.some((m) => /RadioGroup/.test(m) && /onValueChange/.test(m))).toBe(true);
});

test('RG-02: grouped radios are mutually exclusive — only the matching value is checked', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <RadioGroup value="b" onValueChange={() => {}}>
        <Radio value="a" />
        <Radio value="b" />
        <Radio value="c" />
      </RadioGroup>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const radios = findAllByDisplayName(renderer!.root, 'Pressable');
  const checkedStates = radios.map((r) => r.props.accessibilityState.checked);
  expect(checkedStates).toEqual([false, true, false]);
});

test('RG-03: grouped Radio press selects its own value via the group onValueChange, not onCheckedChange', () => {
  const onValueChange = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <RadioGroup value="a" onValueChange={onValueChange}>
        <Radio value="a" />
        <Radio value="b" />
      </RadioGroup>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const radios = findAllByDisplayName(renderer!.root, 'Pressable');
  act(() => {
    (radios[1].props.onPress as () => void)();
  });
  expect(onValueChange).toHaveBeenCalledWith('b');
});

test('RD-01: standalone Radio supports deselection — pressing a checked standalone Radio calls onCheckedChange(false)', () => {
  const onCheckedChange = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Radio checked onCheckedChange={onCheckedChange} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const radio = findByDisplayName(renderer!.root, 'Pressable');
  act(() => {
    (radio.props.onPress as () => void)();
  });
  expect(onCheckedChange).toHaveBeenCalledWith(false);
});
