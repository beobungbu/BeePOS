// https://beeui.beemvp.com/docs/components/list-item/
// "Press behavior is opt-in (onPress makes the row interactive); an
// interactive row without an explicit accessibilityLabel synthesizes one
// from its primitive title/description/trailing content, while
// non-interactive rows never hide complex descendant content."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/list-item.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { ListItem } from '@beemvp/beeui-ui';
import { findByDisplayName } from '../test-utils';

test('LI-01: without onPress, the row is not accessibilityRole="button" (press behavior is opt-in)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<ListItem title="Row" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.accessibilityRole).toBeUndefined();
});

test('LI-02: with onPress, the row is accessibilityRole="button" (interactive)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<ListItem title="Row" onPress={() => {}} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.accessibilityRole).toBe('button');
});

test('LI-03: an interactive row without an explicit accessibilityLabel synthesizes one from title + description', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<ListItem title="Alice" description="Admin" onPress={() => {}} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.accessibilityLabel).toBe('Alice, Admin');
});

test('LI-04: an explicit accessibilityLabel overrides the synthesized one', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<ListItem title="Alice" description="Admin" accessibilityLabel="Custom label" onPress={() => {}} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressable = findByDisplayName(renderer!.root, 'Pressable');
  expect(pressable.props.accessibilityLabel).toBe('Custom label');
});
