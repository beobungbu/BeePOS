// https://beeui.beemvp.com/docs/components/otp-input/
// "Controlled/uncontrolled one-time-code input; entered text is normalized
// to digits only when mode is 'numeric' (the default) — mode: 'text'
// accepts any character unnormalized — and the completion callback fires
// exactly once per completed value — it does not re-fire on further
// keystrokes while already complete, only after the value becomes
// incomplete again."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/otp-input.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { OTPInput } from '@beemvp/beeui-ui';

test('OTP-01: numeric mode (default) strips non-digit characters from the rendered value', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OTPInput defaultValue="1a2b3c" length={6} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.value).toBe('123');
});

test("OTP-02: mode='text' accepts non-digit characters unnormalized", () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OTPInput mode="text" defaultValue="1a2b3c" length={6} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  expect(input.props.value).toBe('1a2b3c');
});

test('OTP-03: onComplete fires exactly once when the value first reaches `length`', () => {
  const onComplete = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OTPInput length={4} onComplete={onComplete} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  act(() => {
    (input.props.onChangeText as (t: string) => void)('1234');
  });
  expect(onComplete).toHaveBeenCalledTimes(1);
  expect(onComplete).toHaveBeenCalledWith('1234');
});

test('OTP-04: onComplete does not re-fire on further keystrokes while already complete (maxLength clamps input, same value)', () => {
  const onComplete = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OTPInput length={4} onComplete={onComplete} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  let input = renderer!.root.findByType(TextInput);
  act(() => {
    (input.props.onChangeText as (t: string) => void)('1234');
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  input = renderer!.root.findByType(TextInput);
  act(() => {
    // Same complete value delivered again (e.g. a re-fired native onChangeText).
    (input.props.onChangeText as (t: string) => void)('1234');
  });
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('OTP-05: onComplete fires again after the value becomes incomplete and then completes again', () => {
  const onComplete = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<OTPInput length={4} onComplete={onComplete} />);
  });
  const type = (text: string) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const input = renderer!.root.findByType(TextInput);
    act(() => {
      (input.props.onChangeText as (t: string) => void)(text);
    });
  };
  type('1234');
  type('123');
  type('1235');
  expect(onComplete).toHaveBeenCalledTimes(2);
  expect(onComplete).toHaveBeenNthCalledWith(2, '1235');
});
