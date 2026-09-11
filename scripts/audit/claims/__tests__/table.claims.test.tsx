// https://beeui.beemvp.com/docs/components/table/
// "Composable primitive family with no owned fetching, sort/filter/selection
// state...TableHead's sortDirection/onSortChange pair is fully
// caller-controlled (the presence of sortDirection is what marks a column
// sortable); TableRow's selected is a caller-owned boolean reflected only
// visually/for accessibility."
// Reality: node_modules/@beemvp/beeui-ui dist/module/components/table.js
import * as React from 'react';
import { create, act } from 'react-test-renderer';
import { View } from 'react-native';
import { Table, TableBody, TableRow, TableCell, TableHeader, TableHead } from '@beemvp/beeui-ui';
import { findAllByDisplayName, withWarnSpy } from '../test-utils';

test('TBL-01: TableRow renders as a plain View (no button/row accessibility role of its own)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const row = findAllByDisplayName(renderer!.root, 'TableRow')[0];
  const hostChild = row.children[0] as unknown as { type: unknown; props: Record<string, unknown> };
  const typeName =
    typeof hostChild.type === 'string'
      ? hostChild.type
      : (hostChild.type as { displayName?: string; name?: string }).displayName ?? (hostChild.type as { name?: string }).name;
  expect(typeName).toBe('View');
  expect(hostChild.props.accessibilityRole).toBeUndefined();
});

test('TBL-02: the presence of sortDirection is what marks a TableHead column sortable (renders a press target)', () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Unsortable</TableHead>
            <TableHead sortDirection="none" onSortChange={() => {}}>
              Sortable
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const pressables = findAllByDisplayName(renderer!.root, 'Pressable');
  expect(pressables.length).toBe(1);
});

test('TBL-03: a sortable TableHead without onSortChange warns in development', () => {
  const calls = withWarnSpy(() => {
    act(() => {
      create(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead sortDirection="none">Sortable</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      );
    });
  });
  expect(calls.some((m) => /TableHead/.test(m) && /onSortChange/.test(m))).toBe(true);
});

test("TBL-04: TableRow's selected is reflected in accessibilityState.selected on the row's own host View", () => {
  let renderer: ReturnType<typeof create>;
  act(() => {
    renderer = create(
      <Table>
        <TableBody>
          <TableRow selected>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
  });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const view = renderer!.root.findAllByType(View).find((v) => v.props.accessibilityState?.selected !== undefined);
  expect(view?.props.accessibilityState.selected).toBe(true);
});
