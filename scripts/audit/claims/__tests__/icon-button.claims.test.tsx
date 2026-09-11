// https://beeui.beemvp.com/docs/components/icon-button/
// "Stateless 44px icon-only pressable sharing Button's disabled/loading
// semantics; an accessible label (accessibilityLabel) is required because
// there is no visible text to derive one from."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/icon-button.js
// (IconButton is a thin wrapper: `<Button {...props} size="icon" />`.)
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { IconButton } from '@beemvp/beeui-ui';
import { findByDisplayName } from '../test-utils';

test('IB-01: shares Button\'s loading semantics — loading blocks press handling (disabled=true)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<IconButton accessibilityLabel="Delete" loading />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.disabled).toBe(true);
});

test('IB-02: renders the supplied accessibilityLabel on the underlying Pressable (required, no visible text to derive one from)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<IconButton accessibilityLabel="Delete" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.accessibilityLabel).toBe('Delete');
});

test('IB-03: always renders size="icon" on the shared Button regardless of a caller-supplied size', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    // @ts-expect-error IconButtonProps documents `size` as omitted from its own type; this checks the runtime forces it anyway.
    renderer = create(<IconButton accessibilityLabel="Delete" size="lg" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.className).toEqual(expect.stringContaining('h-control-icon'));
});
