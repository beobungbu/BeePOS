// https://beeui.beemvp.com/docs/components/avatar/
// "Stateless image-with-fallback: an image load failure resets to the
// fallback, and the reset is keyed to the semantic image source content
// (not object identity), so re-supplying an already-failed source shows
// the fallback again immediately."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/avatar.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Image, Text } from 'react-native';
import { Avatar } from '@beemvp/beeui-ui';

test('AV-01: an image load failure resets to the fallback text', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Avatar source={{ uri: 'https://example.com/a.png' }} fallback="AB" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(renderer!.root.findAllByType(Text).length).toBe(0);
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const image = renderer!.root.findByType(Image);
    (image.props.onError as (e: unknown) => void)({});
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const texts = renderer!.root.findAllByType(Text);
  expect(texts.length).toBe(1);
  expect(texts[0].props.children).toBe('AB');
});

test('AV-02: re-supplying an already-failed source (new object, same URI) shows the fallback again immediately', () => {
  let renderer: ReturnType<typeof create>;
  const source = { uri: 'https://example.com/a.png' };
  act(() => {
    renderer = create(<Avatar source={source} fallback="AB" />);
  });
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const image = renderer!.root.findByType(Image);
    (image.props.onError as (e: unknown) => void)({});
  });
  // A new object with the same semantic content (uri) — object identity differs.
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    renderer!.update(<Avatar source={{ uri: 'https://example.com/a.png' }} fallback="AB" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const texts = renderer!.root.findAllByType(Text);
  expect(texts.length).toBe(1);
  expect(texts[0].props.children).toBe('AB');
});

test('AV-03: a different source (new URI) resets the failed flag and attempts the image again', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<Avatar source={{ uri: 'https://example.com/a.png' }} fallback="AB" />);
  });
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const image = renderer!.root.findByType(Image);
    (image.props.onError as (e: unknown) => void)({});
  });
  act(() => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    renderer!.update(<Avatar source={{ uri: 'https://example.com/b.png' }} fallback="AB" />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  expect(renderer!.root.findAllByType(Image).length).toBe(1);
});
