// https://beeui.beemvp.com/docs/components/tabs/
// "Fully controlled (value/onValueChange, required — there is no
// uncontrolled mode) tab state shared across TabsList/TabsTrigger/
// TabsContent; enabled usage without onValueChange warns in development,
// and an inactive TabsContent panel is not mounted."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/tabs.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Text } from 'react-native';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@beemvp/beeui-ui';
import { withWarnSpy } from '../test-utils';

function renderTabs(value: string) {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Tabs value={value} onValueChange={() => {}}>
        <TabsList>
          <TabsTrigger value="one">One</TabsTrigger>
          <TabsTrigger value="two">Two</TabsTrigger>
        </TabsList>
        <TabsContent value="one">
          <Text>Panel one content</Text>
        </TabsContent>
        <TabsContent value="two">
          <Text>Panel two content</Text>
        </TabsContent>
      </Tabs>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return renderer!;
}

test('TABS-01: enabled usage without onValueChange warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <Tabs value="one">
          <TabsList>
            <TabsTrigger value="one">One</TabsTrigger>
          </TabsList>
        </Tabs>
      );
    });
  });
  expect(calls.some((m) => /Tabs/.test(m) && /onValueChange/.test(m))).toBe(true);
});

test('TABS-02: the active TabsContent panel is mounted', () => {
  const renderer = renderTabs('one');
  const texts = renderer.root.findAllByType(Text).map((t) => t.props.children);
  expect(texts).toContain('Panel one content');
});

test('TABS-03: an inactive TabsContent panel is not mounted', () => {
  const renderer = renderTabs('one');
  const texts = renderer.root.findAllByType(Text).map((t) => t.props.children);
  expect(texts).not.toContain('Panel two content');
});
