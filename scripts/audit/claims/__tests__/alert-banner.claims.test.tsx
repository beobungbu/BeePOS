// https://beeui.beemvp.com/docs/components/alert-banner/
// "Stateless inline callout with no open/close or controlled prop; it
// live-announces (Android live-region, iOS AccessibilityInfo) whenever
// mounted with new content, with an optional explicit announcement
// override for complex children."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/alert-banner.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { AlertBanner } from '@beemvp/beeui-ui';

test('AB-01: sets accessibilityLiveRegion from the `live` prop, default "polite"', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<AlertBanner title="Heads up" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.accessibilityLiveRegion).toBe('polite');
});

test('AB-02: live="none" is reflected as accessibilityLiveRegion="none" (suppressing the announcement)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<AlertBanner title="Heads up" live="none" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findByType(View);
  expect(view.props.accessibilityLiveRegion).toBe('none');
});
