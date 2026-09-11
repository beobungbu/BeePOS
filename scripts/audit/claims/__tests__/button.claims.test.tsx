// Phase 07 Worker A / A2 behavior claims for Button.
// Source doc: https://beeui.beemvp.com/docs/components/button/
// Quoted claim (State and behavior contract): "Stateless pressable driven
// entirely by props (variant/size/loading/disabled); disabled or loading
// both block press handling and mark the accessibility disabled state, and
// loading swaps in a spinner without changing the button's footprint."
// Reality evidence: node_modules/@beemvp/beeui-ui dist/module/components/button.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import { Button } from '@beemvp/beeui-ui';
import { findByDisplayName, findAllByDisplayName } from '../test-utils';

function renderButton(props: Record<string, unknown>) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Button {...props}>Save</Button>);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return renderer!;
}

test('BTN-01: disabled blocks press handling (Pressable receives disabled=true)', () => {
  const renderer = renderButton({ disabled: true });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.disabled).toBe(true);
});

test('BTN-02: loading blocks press handling (Pressable receives disabled=true)', () => {
  const renderer = renderButton({ loading: true });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.disabled).toBe(true);
});

test('BTN-03: disabled marks the accessibility disabled state', () => {
  const renderer = renderButton({ disabled: true });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.accessibilityState.disabled).toBe(true);
});

test('BTN-04: loading marks the accessibility disabled state (and aria-busy)', () => {
  const renderer = renderButton({ loading: true });
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.accessibilityState.disabled).toBe(true);
  expect(pressable.props['aria-busy']).toBe(true);
});

test('BTN-05: loading swaps in a spinner (ActivityIndicator) alongside the label', () => {
  const renderer = renderButton({ loading: true });
  const indicators = findAllByDisplayName(renderer.root, 'ActivityIndicator');
  expect(indicators.length).toBeGreaterThanOrEqual(1);
  expect(renderer.root.findAllByType(ActivityIndicator).length + indicators.length).toBeGreaterThan(0);
});

test('BTN-06 (baseline): non-loading, non-disabled Button is not disabled and shows no spinner', () => {
  const renderer = renderButton({});
  const pressable = findByDisplayName(renderer.root, 'Pressable');
  expect(pressable.props.disabled).toBeFalsy();
  expect(findAllByDisplayName(renderer.root, 'ActivityIndicator').length).toBe(0);
});
