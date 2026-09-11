// https://beeui.beemvp.com/docs/components/timeline/
// "Stateless read-only ordered history composition; terminal connector
// placement is derived automatically from the rendered TimelineItem
// children, and supplied child keys are preserved — it owns no workflow
// state."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/timeline.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { Timeline, TimelineItem } from '@beemvp/beeui-ui';

test('TL-01: only the last TimelineItem omits its connector line (terminal placement auto-derived)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Timeline>
        <TimelineItem title="First" />
        <TimelineItem title="Second" />
        <TimelineItem title="Third" />
      </Timeline>
    );
  });
  // The connector line has a distinct className (`absolute bottom-0 top-5 w-px bg-border`);
  // count how many of the 3 items render one.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const connectors = renderer!.root
    .findAllByType(View)
    .filter((v) => typeof v.props.className === 'string' && (v.props.className as string).includes('absolute bottom-0 top-5'));
  expect(connectors.length).toBe(2); // every item except the last
});

test('TL-02: the rail column is hidden from accessibility on every item, regardless of position', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Timeline>
        <TimelineItem title="First" />
        <TimelineItem title="Last" />
      </Timeline>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const railColumns = renderer!.root.findAllByType(View).filter((v) => v.props.accessibilityElementsHidden === true);
  expect(railColumns.length).toBe(2);
});
