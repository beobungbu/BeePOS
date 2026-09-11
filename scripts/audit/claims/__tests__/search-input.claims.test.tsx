// https://beeui.beemvp.com/docs/components/search-input/
// "Uncontrolled-by-default search-keyboard field layered on Input; clearing
// a previously non-empty query emits exactly one onSearch('') reset call,
// not one per keystroke of the clear action."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/search-input.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { TextInput } from 'react-native';
import { SearchInput } from '@beemvp/beeui-ui';

test("SI-01: clearing a previously non-empty query emits exactly one onSearch('') call", () => {
  const onSearch = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<SearchInput onSearch={onSearch} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  act(() => {
    (input.props.onChangeText as (t: string) => void)('milk');
  });
  act(() => {
    (input.props.onChangeText as (t: string) => void)('');
  });
  expect(onSearch).toHaveBeenCalledTimes(1);
  expect(onSearch).toHaveBeenCalledWith('');
});

test('SI-02: onSearch is not called for every keystroke while typing (only on the empty-clear transition or submit)', () => {
  const onSearch = jest.fn();
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(<SearchInput onSearch={onSearch} />);
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const input = renderer!.root.findByType(TextInput);
  act(() => {
    (input.props.onChangeText as (t: string) => void)('m');
    (input.props.onChangeText as (t: string) => void)('mi');
    (input.props.onChangeText as (t: string) => void)('mil');
  });
  expect(onSearch).not.toHaveBeenCalled();
});
