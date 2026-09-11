// https://beeui.beemvp.com/docs/components/progress/
// "Stateless clamped determinate progress bar; there is no lower-bound
// prop — value is clamped between 0 and max, and max itself falls back to
// 100 when non-finite or <= 0 — and it exposes native progressbar semantics
// with no indeterminate mode."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/progress.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { Progress } from '@beemvp/beeui-ui';

function renderProgress(props: Record<string, unknown>) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Progress {...props} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findAllByType(View).find((v) => v.props.accessibilityRole === 'progressbar');
  return view;
}

test('PROG-01: a value above max is clamped to max', () => {
  const view = renderProgress({ value: 999, max: 100 });
  expect(view?.props.accessibilityValue).toEqual({ max: 100, min: 0, now: 100 });
});

test('PROG-02: a negative value is clamped to 0 (no lower-bound prop, floor is fixed at 0)', () => {
  const view = renderProgress({ value: -50, max: 100 });
  expect(view?.props.accessibilityValue.now).toBe(0);
});

test('PROG-03: a non-finite max falls back to 100', () => {
  const view = renderProgress({ value: 40, max: Number.NaN });
  expect(view?.props.accessibilityValue.max).toBe(100);
});

test('PROG-04: a max <= 0 falls back to 100', () => {
  const view = renderProgress({ value: 40, max: 0 });
  expect(view?.props.accessibilityValue.max).toBe(100);
});

test('PROG-05: exposes accessibilityRole progressbar', () => {
  const view = renderProgress({ value: 40 });
  expect(view?.props.accessibilityRole).toBe('progressbar');
});
