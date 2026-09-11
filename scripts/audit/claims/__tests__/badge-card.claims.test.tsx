// https://beeui.beemvp.com/docs/components/badge/ and .../card/
// Badge: "Stateless semantic status label; variant selects the paired
// foreground/background token pair, with no controlled/open state or
// callbacks."
// Card: "Stateless elevated/outlined surface driven by a variant and
// spacing prop; no controlled state or callbacks."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/{badge,card}.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { Badge, Card } from '@beemvp/beeui-ui';

test('BADGE-01: variant selects a distinct className token pair (default primary vs. destructive differ)', () => {
  let rendererPrimary: ReturnType<typeof create>;
  let rendererDestructive: ReturnType<typeof create>;
  act(() => {
    rendererPrimary = create(<Badge>Active</Badge>);
    rendererDestructive = create(<Badge variant="destructive">Active</Badge>);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const primaryClass = rendererPrimary!.root.findByType(View).props.className as string;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const destructiveClass = rendererDestructive!.root.findByType(View).props.className as string;
  expect(primaryClass).toEqual(expect.stringContaining('border-primary'));
  expect(destructiveClass).toEqual(expect.stringContaining('border-destructive'));
  expect(primaryClass).not.toBe(destructiveClass);
});

test('CARD-01: default variant is "outlined" (bordered) per its documented default', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Card />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.className).toEqual(expect.stringContaining('border'));
});

test('CARD-02: padding="none" renders no padding utility class', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Card padding="none" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.className).not.toEqual(expect.stringContaining('p-4'));
});
