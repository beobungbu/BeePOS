/**
 * Login reads the org store, not the seed arrays. Everything `/staff` can do to a member has
 * to reach the login form: a new PIN must work, a deactivated member must be skipped, and a
 * member created in the app must get in.
 *
 * The seed deliberately gives every member the same mock PIN (`src/data/seed/staff.ts`), so
 * these cases give the member under test a PIN of their own first. Without that, the store
 * code and PIN pair identifies a store rather than a person, and the assertions would be
 * about whichever member the array happens to list first.
 */
import { useOrgStore } from '../org-store';
import { useSessionStore } from '../session-store';
import { staff as seedStaff, stores as seedStores } from '../seed';

const STORE = seedStores[0];
const CASHIER = seedStaff.find(
  (member) => member.role === 'cashier' && member.storeIds.includes(STORE.id),
)!;

function resetStores(): void {
  useOrgStore.setState({ stores: seedStores, staff: seedStaff, staffActiveById: {} });
  useSessionStore.setState({ staff: null, store: null, storeOptions: [] });
}

const login = (code: string, pin: string) => useSessionStore.getState().login(code, pin);

beforeEach(resetStores);

describe('login', () => {
  it('signs in a seeded member with the right store code and PIN', () => {
    expect(login(STORE.code, CASHIER.pin)).toBe(true);
    expect(useSessionStore.getState().store?.id).toBe(STORE.id);
  });

  it('rejects an unknown store code and a wrong PIN', () => {
    expect(login('NOPE', CASHIER.pin)).toBe(false);
    expect(login(STORE.code, '0000')).toBe(false);
    expect(useSessionStore.getState().staff).toBeNull();
  });

  it('honours a PIN reset made on the staff screen', () => {
    useOrgStore.getState().resetStaffPin(CASHIER.id, '4321');

    expect(login(STORE.code, '4321')).toBe(true);
    expect(useSessionStore.getState().staff?.id).toBe(CASHIER.id);
  });

  it('turns away a member who was deactivated on the staff screen', () => {
    useOrgStore.getState().resetStaffPin(CASHIER.id, '4321');
    useOrgStore.getState().setStaffActive(CASHIER.id, false);

    expect(login(STORE.code, '4321')).toBe(false);
    expect(useSessionStore.getState().staff).toBeNull();
  });

  it('still admits the others when one member of a shared PIN is deactivated', () => {
    useOrgStore.getState().setStaffActive(CASHIER.id, false);

    expect(login(STORE.code, CASHIER.pin)).toBe(true);
    expect(useSessionStore.getState().staff?.id).not.toBe(CASHIER.id);
  });

  it('lets a member created in the app sign in', () => {
    useOrgStore.getState().upsertStaff({
      id: 'staff-new',
      name: 'Ngô Thị Mai',
      role: 'cashier',
      storeIds: [STORE.id],
      pin: '5678',
    });

    expect(login(STORE.code, '5678')).toBe(true);
    expect(useSessionStore.getState().staff?.id).toBe('staff-new');
  });
});
