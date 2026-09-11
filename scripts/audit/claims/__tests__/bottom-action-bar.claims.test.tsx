// https://beeui.beemvp.com/docs/components/bottom-action-bar/
// "Stateless bottom-anchored action surface with no controlled props; it
// adds no system-inset padding itself, so the app shell must wrap it with
// SafeArea or safe-area utilities." Also: `bordered` defaults to `true`.
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/bottom-action-bar.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { BottomActionBar } from '@beemvp/beeui-ui';

test('BAB-01: bordered defaults to true (border className present without an explicit prop)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<BottomActionBar />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.className).toEqual(expect.stringContaining('border-t'));
});

test('BAB-02: bordered=false omits the border className', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<BottomActionBar bordered={false} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.className).not.toEqual(expect.stringContaining('border-t'));
});
