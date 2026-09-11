// https://beeui.beemvp.com/docs/components/skeleton/
// "Stateless decorative static loading placeholder; it is hidden from the
// accessibility tree and carries no loading-state callbacks."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/skeleton.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { Skeleton } from '@beemvp/beeui-ui';

test('SK-01: hidden from the accessibility tree (aria-hidden + accessible=false)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Skeleton />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props['aria-hidden']).toBe(true);
  expect(view.props.accessible).toBe(false);
});
