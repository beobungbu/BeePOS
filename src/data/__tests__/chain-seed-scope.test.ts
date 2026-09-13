/**
 * What a chain that is not the demo chain starts with: its own shop, and nothing else.
 *
 * The P7 worker emptied the catalogue and the stock for a new chain, and left the rest: a
 * second chain still opened on the demo chain's orders, buyers, price lists, promotions,
 * ledgers, cash book and fourteen unread notifications, with the bell reading "9+" in a shop
 * that has never sold anything (`reports/p7-native-fix-report.md` 7.1).
 *
 * Every seeded slice now answers the question for itself through `demoSeed`, and this asks all
 * of them at once, because the failure mode is one slice being forgotten rather than the
 * mechanism being wrong.
 */

// The scope has to be mocked, and its binding initialised, before the stores are imported:
// each one reads the active chain while it is being created, so an import above this line
// would build its slice against the real scope and the mock would come too late.
/* eslint-disable import/first */
// The `mock` prefix is what lets the hoisted `jest.mock` factory below reach this binding.
let mockOrgId = 'chuoi-demo';

jest.mock('../active-org', () => ({
  ACTIVE_ORG_KEY: 'beepos.activeOrgId',
  activeOrgId: () => mockOrgId,
  loadActiveOrgId: async () => mockOrgId,
  setActiveOrgId: async () => undefined,
}));

import { auditSeedForActiveOrg } from '../audit-store';
import { catalogSeedForActiveOrg } from '../catalog-store';
import { costingSeedForActiveOrg } from '../costing-store';
import { customerSeedForActiveOrg } from '../customer-store';
import { inventorySeedForActiveOrg } from '../inventory-store';
import { ledgerSeedForActiveOrg } from '../ledger-store';
import { lotSeedForActiveOrg } from '../lot-store';
import { notificationSeedForActiveOrg } from '../notification-store';
import { orderSeedForActiveOrg } from '../order-store';
import { orgSettingsSeedForActiveOrg } from '../org-settings-store';
import { pricingSeedForActiveOrg } from '../pricing-store';
import { purchasingSeedForActiveOrg } from '../purchasing-store';
import { returnsSeedForActiveOrg } from '../returns-store';
import { storePriceSeedForActiveOrg } from '../store-price-store';
import { supplierSeedForActiveOrg } from '../supplier-store';
import { DEMO_ORG_ID } from '../seed/org';

const SECOND_CHAIN = 'chuoi-demo-2';

/** Every seeded list a chain could inherit, by the name the report names it with. */
function slicesOfActiveChain(): Record<string, readonly unknown[]> {
  const orders = orderSeedForActiveOrg();
  const pricing = pricingSeedForActiveOrg();
  const ledger = ledgerSeedForActiveOrg();
  const purchasing = purchasingSeedForActiveOrg();
  const returns = returnsSeedForActiveOrg();
  const inventory = inventorySeedForActiveOrg();
  const catalog = catalogSeedForActiveOrg();
  return {
    products: catalog.products,
    categories: catalog.categories,
    stockLevels: inventory.stockLevels,
    goodsReceipts: inventory.goodsReceipts,
    orders: orders.orders,
    shifts: orders.shifts,
    refunds: orders.refunds,
    deliveryNotes: orders.deliveryNotes,
    customers: customerSeedForActiveOrg().customers,
    pointHistory: customerSeedForActiveOrg().pointHistory,
    suppliers: supplierSeedForActiveOrg().suppliers,
    storePrices: storePriceSeedForActiveOrg().prices,
    customerGroups: pricing.customerGroups,
    priceLists: pricing.priceLists,
    priceRules: pricing.priceRules,
    promotions: pricing.promotions,
    ledgerEntries: ledger.entries,
    bankAccounts: ledger.bankAccounts,
    cashBook: ledger.cashBook,
    costHistory: costingSeedForActiveOrg().history,
    returns: returns.returns,
    writeOffs: returns.writeOffs,
    purchaseOrders: purchasing.purchaseOrders,
    supplierReturns: purchasing.supplierReturns,
    lots: lotSeedForActiveOrg().lots,
    storeSettings: orgSettingsSeedForActiveOrg().storeSettings,
    notifications: notificationSeedForActiveOrg().notifications,
    auditEvents: auditSeedForActiveOrg().events,
  };
}

afterEach(() => {
  mockOrgId = DEMO_ORG_ID;
});

describe('chain seed scope', () => {
  it('gives the demo chain the seeded shop', () => {
    mockOrgId = DEMO_ORG_ID;
    for (const [name, rows] of Object.entries(slicesOfActiveChain())) {
      expect(`${name}: ${rows.length > 0}`).toBe(`${name}: true`);
    }
  });

  it('starts a second chain empty, slice by slice', () => {
    mockOrgId = SECOND_CHAIN;
    for (const [name, rows] of Object.entries(slicesOfActiveChain())) {
      expect(`${name}: ${rows.length}`).toBe(`${name}: 0`);
    }
  });

  it('still gives a new chain a loyalty rule of its own', () => {
    mockOrgId = SECOND_CHAIN;
    const rule = pricingSeedForActiveOrg().loyaltyRule;
    // A setting rather than data: every till needs one to award a point, and it belongs to the
    // chain that is running rather than to the chain it was seeded for.
    expect(rule.orgId).toBe(SECOND_CHAIN);
    expect(rule.earnPerVnd).toBeGreaterThan(0);
  });

  it('keeps the memberships and the chain directory, which are how the owner gets in', () => {
    mockOrgId = SECOND_CHAIN;
    const { memberships, orgDirectory } = jest.requireActual<
      typeof import('../seed')
    >('../seed');
    expect(memberships.some((entry) => entry.orgId === SECOND_CHAIN)).toBe(true);
    expect(orgDirectory.some((entry) => entry.id === SECOND_CHAIN)).toBe(true);
  });
});
