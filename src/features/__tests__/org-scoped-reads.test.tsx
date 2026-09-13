/**
 * Chain isolation on the read-only screens.
 *
 * The shops and the roster are per chain. A screen that reads them from the seed modules
 * instead of the org store shows the demo chain's branches and staff to an owner who has
 * switched into the second chain, which is the one thing a multi-chain prototype must never
 * do. The per-store stock table is the smallest of those screens, so it stands in for them
 * here: rendered with the second chain active it has to name that chain's one branch and none
 * of the demo chain's four.
 */
// The `mock` prefix is what lets the hoisted `jest.mock` factory below reach these bindings.
import { act, createElement as mockCreateElement } from 'react';
import { Text as MockRnText, View as MockRnView } from 'react-native';
import { create, type ReactTestRenderer } from 'react-test-renderer';
import { useOrgStore } from '../../data/org-store';
import {
  secondOrganization,
  secondOrgAccounts,
  secondOrgRegisters,
  secondOrgStaff,
  secondOrgStores,
  staff as seedStaff,
  stores as seedStores,
} from '../../data/seed';
import { ProductStockTable } from '../products/product-stock-table';

/**
 * The UI kit ships ESM this jest preset does not transform, and the kit's own rendering is not
 * what is under test: the branch names the table reads are. Stub primitives keep the
 * component, its store reads and its row mapping real.
 */
jest.mock('@beemvp/beeui-ui', () => {
  const box = ({ children }: { children?: unknown }) =>
    mockCreateElement(MockRnView, null, children as never);
  const text = ({ children }: { children?: unknown }) =>
    mockCreateElement(MockRnText, null, children as never);
  return {
    Input: () => null,
    Table: box,
    TableBody: box,
    TableCell: box,
    TableHead: text,
    TableHeader: box,
    TableRow: box,
    Text: text,
  };
});

/** Names that exist only in the demo chain: the owner is one person across both chains. */
const DEMO_ONLY_NAMES = [
  ...seedStores.map((store) => store.name),
  ...seedStaff
    .filter((member) => !secondOrgStaff.some((other) => other.name === member.name))
    .map((member) => member.name),
];

/** Every text node of a rendered tree, flattened, so a name can be searched for whole. */
function textOf(renderer: ReactTestRenderer): string {
  const parts: string[] = [];
  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      parts.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (node && typeof node === 'object' && 'children' in node) {
      walk((node as { children: unknown }).children);
    }
  };
  walk(renderer.toJSON());
  return parts.join(' ');
}

describe('org-scoped reads', () => {
  afterEach(() => {
    useOrgStore.setState({ stores: seedStores, staff: seedStaff });
  });

  it('names the branches of the active chain, not the demo chain', () => {
    useOrgStore.setState({
      organization: secondOrganization,
      stores: secondOrgStores,
      staff: secondOrgStaff,
      registers: secondOrgRegisters,
      accounts: secondOrgAccounts,
      staffActiveById: {},
      storeHoursById: {},
    });

    let renderer: ReactTestRenderer | undefined;
    act(() => {
      renderer = create(<ProductStockTable productId="product-1" />);
    });
    if (!renderer) throw new Error('render produced no tree');
    const rendered = textOf(renderer);

    expect(rendered).toContain(secondOrgStores[0].name);
    for (const name of DEMO_ONLY_NAMES) {
      expect(rendered).not.toContain(name);
    }

    act(() => {
      renderer?.unmount();
    });
  });
});
