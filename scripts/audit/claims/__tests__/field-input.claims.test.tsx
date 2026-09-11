// https://beeui.beemvp.com/docs/components/field/ and .../input/
// Field: "Stateless label/description/error composition; it wires
// accessible label/required/error relationships only to a wrapped
// text-entry control (Input/Textarea)."
// Input: "Uncontrolled-by-default text field...invalid/disabled/focus state
// drive semantic styling, while label/required/error metadata come from a
// wrapping Field, not from Input itself."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/{field,input}.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { Field, Input } from '@beemvp/beeui-ui';

test('FI-01: Field wires its labelNativeID to the wrapped Input as accessibilityLabelledBy', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Field label="Email">
        <Input />
      </Field>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(typeof input.props.accessibilityLabelledBy).toBe('string');
  expect((input.props.accessibilityLabelledBy as string).length).toBeGreaterThan(0);
});

test('FI-02: Field required=true is reflected in the wrapped Input\'s synthesized accessibilityLabel', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Field label="Email" required>
        <Input />
      </Field>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.accessibilityLabel).toBe('Email, required');
});

test('FI-03: Field disabled=true ORs into the wrapped Input\'s own disabled/editable state', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Field label="Email" disabled>
        <Input />
      </Field>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.accessibilityState.disabled).toBe(true);
  expect(input.props.editable).toBe(false);
});

test('FI-04: Input disabled sets editable=false', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Input disabled />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.editable).toBe(false);
});

test('FI-05: Input is uncontrolled-by-default (no `value` prop is forced; a plain defaultValue passes through)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Input defaultValue="hello" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.value).toBeUndefined();
  expect(input.props.defaultValue).toBe('hello');
});
