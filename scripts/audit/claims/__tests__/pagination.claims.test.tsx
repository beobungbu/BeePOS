// https://beeui.beemvp.com/docs/components/pagination/
// "Controlled page/onPageChange context shared with every PaginationItem;
// page boundaries are normalized (out-of-range requests are clamped), and a
// malformed runtime page item (e.g. a type="page" item with no page number)
// fails safe as disabled."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/pagination.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { Pagination, PaginationItem } from '@beemvp/beeui-ui';
import { findAllByDisplayName, withWarnSpy } from '../test-utils';

test('PAG-01: an out-of-range target item (page beyond pageCount) is disabled', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Pagination page={1} pageCount={3} onPageChange={() => {}}>
        <PaginationItem type="page" page={1} />
        <PaginationItem type="page" page={5} />
      </Pagination>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const items = findAllByDisplayName(renderer!.root, 'Pressable');
  expect(items[0].props.disabled).toBe(false);
  expect(items[1].props.disabled).toBe(true);
});

test('PAG-02: a malformed runtime page item (type="page", no page number) fails safe as disabled', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Pagination page={1} pageCount={3} onPageChange={() => {}}>
        {/* @ts-expect-error deliberately omitting `page` to test the documented fail-safe */}
        <PaginationItem type="page" />
      </Pagination>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const item = findAllByDisplayName(renderer!.root, 'Pressable')[0];
  expect(item.props.disabled).toBe(true);
});

test('PAG-03: a malformed page item warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <Pagination page={1} pageCount={3} onPageChange={() => {}}>
          {/* @ts-expect-error deliberately omitting `page` to test the documented fail-safe */}
          <PaginationItem type="page" />
        </Pagination>
      );
    });
  });
  expect(calls.some((m) => /PaginationItem/.test(m) && /page/.test(m))).toBe(true);
});

test('PAG-04: page is clamped to [1, pageCount] — an out-of-range Pagination page prop renders the clamped page as selected', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Pagination page={99} pageCount={3} onPageChange={() => {}}>
        <PaginationItem type="page" page={3} />
      </Pagination>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const item = findAllByDisplayName(renderer!.root, 'Pressable')[0];
  expect(item.props.accessibilityState.selected).toBe(true);
});
