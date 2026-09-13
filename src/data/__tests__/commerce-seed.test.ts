/**
 * Locks the seed invariants the four wave-1 screen workers build against.
 *
 * These are not tests of the seed generators; they are the contract for the ids, counts and
 * money figures the mockups are drawn with. A change that quietly moves one of them breaks a
 * screen somebody else is writing, which is exactly the failure this catches.
 */

import {
  SEED_NOW,
  bankAccounts,
  cashBook,
  companyCustomers,
  costHistory,
  customerGroups,
  customers,
  deliveryNotes,
  goodsReceipts,
  ledgerEntries,
  lots,
  loyaltyRule,
  memberships,
  notifications,
  orgDirectory,
  priceLists,
  priceRules,
  products,
  promotions,
  purchaseOrders,
  returnRecords,
  storeSettings,
  supplierReturns,
  wholesaleOrders,
  writeOffs,
  SECOND_ORG_ID,
} from '../seed';
import { agingFor, balanceFor, balances, creditCheck, openInvoices } from '../../domain/ledger';
import { TEMPLATE_KEYS_BY_KIND } from '../../domain/notify';
import { resolvePrice } from '../../domain/pricing';
import { findByBarcode } from '../../domain/units';

const MINH_LONG_ID = 'customer-41';

describe('customers', () => {
  it('gives every customer a type and every company the B2B fields', () => {
    expect(customers.every((customer) => customer.type === 'retail' || customer.type === 'company')).toBe(
      true,
    );
    expect(companyCustomers).toHaveLength(12);
    for (const company of companyCustomers) {
      expect(company.type).toBe('company');
      expect(company.taxCode).toMatch(/^\d{10}$/);
      expect(company.groupId).toBeDefined();
      expect(company.salesRepId).toBeDefined();
      expect(company.deliveryAddress).toBeTruthy();
      expect(typeof company.creditLimit).toBe('number');
      expect(typeof company.paymentTermDays).toBe('number');
    }
  });

  it('numbers the companies straight on from the retail accounts', () => {
    expect(companyCustomers[0].id).toBe(MINH_LONG_ID);
    expect(companyCustomers[11].id).toBe('customer-52');
    expect(new Set(customers.map((customer) => customer.id)).size).toBe(customers.length);
  });

  it('matches the mockup on the account every commerce screen is drawn around', () => {
    const minhLong = customers.find((customer) => customer.id === MINH_LONG_ID);
    expect(minhLong).toMatchObject({
      companyName: 'Cty TNHH Thương mại Minh Long',
      taxCode: '0106847221',
      groupId: 'group-agent-a',
      salesRepId: 'staff-7',
      creditLimit: 80_000_000,
      paymentTermDays: 30,
    });
  });

  it('leaves one company with no credit, so the refusal path has a subject', () => {
    expect(companyCustomers.filter((company) => company.creditLimit === 0)).toHaveLength(1);
  });
});

describe('pricing', () => {
  it('ships three groups at the discounts the mockups show', () => {
    expect(customerGroups.map((group) => [group.name, group.discountPercent])).toEqual([
      ['Lẻ', 0],
      ['Đại lý A', 5],
      ['Đại lý B', 8],
    ]);
  });

  it('ships two price lists and about thirty rules, tiers included', () => {
    expect(priceLists).toHaveLength(2);
    expect(priceRules.length).toBeGreaterThanOrEqual(28);
    expect(priceRules.filter((rule) => rule.minQty > 1).length).toBeGreaterThanOrEqual(6);
    expect(priceRules.filter((rule) => rule.customerId).length).toBe(4);
    expect(new Set(priceRules.map((rule) => rule.id)).size).toBe(priceRules.length);
  });

  it('prices a rule cheaper the deeper its tier', () => {
    const tiers = priceRules
      .filter((rule) => rule.priceListId === 'pricelist-agent-a' && rule.productId === 'product-1')
      .sort((a, b) => a.minQty - b.minQty);
    expect(tiers.length).toBeGreaterThan(1);
    for (let i = 1; i < tiers.length; i += 1) {
      expect(tiers[i].unitPrice).toBeLessThan(tiers[i - 1].unitPrice);
    }
  });

  it('has one promotion of each shape, three live and one expired', () => {
    expect(promotions).toHaveLength(4);
    expect(promotions.map((promotion) => promotion.type)).toEqual([
      'percent',
      'buy_x_get_y',
      'amount',
      'percent',
    ]);
    const live = promotions.filter(
      (promotion) =>
        promotion.isActive &&
        promotion.startsAt <= SEED_NOW &&
        promotion.endsAt >= SEED_NOW,
    );
    expect(live).toHaveLength(3);
    expect(promotions.find((promotion) => promotion.id === 'promo-1')?.name).toBe(
      'KM Tết sữa Vinamilk',
    );
  });

  it('carries a loyalty rule whose tiers earn more than bronze', () => {
    expect(loyaltyRule.earnPerVnd).toBeCloseTo(1 / 10_000);
    expect(loyaltyRule.redeemVndPerPoint).toBe(1000);
    expect(loyaltyRule.tierMultiplier?.bronze).toBe(1);
    expect(loyaltyRule.tierMultiplier?.platinum).toBeGreaterThan(1);
  });

  it('resolves a group price for a company buyer on a seeded product', () => {
    const product = products.find((item) => item.id === 'product-1');
    const minhLong = customers.find((customer) => customer.id === MINH_LONG_ID);
    const result = resolvePrice(product!, 1, undefined, {
      customer: minhLong,
      groups: customerGroups,
      priceLists,
      priceRules,
      now: SEED_NOW,
    });
    // Minh Long has a negotiated price on this SKU, so the customer rule has to win.
    expect(result.source).toBe('customer');
    expect(result.unitPrice).toBeLessThan(product!.salePrice);
  });
});

describe('catalogue', () => {
  it('gives twenty SKUs a selling unit and a minimum order quantity', () => {
    const withUnits = products.filter((product) => (product.units?.length ?? 0) > 0);
    expect(withUnits).toHaveLength(20);
    for (const product of withUnits) {
      expect(product.minOrderQty).toBeGreaterThan(1);
      expect(product.units?.every((unit) => unit.factor > 1)).toBe(true);
    }
  });

  it('gives ten SKUs a second barcode and ten the lot flag', () => {
    expect(products.filter((product) => (product.barcodes?.length ?? 0) > 0)).toHaveLength(10);
    expect(products.filter((product) => product.trackLots)).toHaveLength(10);
  });

  it('keeps every barcode unique across SKUs, extra codes and case codes', () => {
    const codes = products.flatMap((product) => [
      product.barcode,
      ...(product.barcodes ?? []),
      ...(product.units ?? []).flatMap((unit) => (unit.barcode ? [unit.barcode] : [])),
    ]);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('scans a case barcode back to its product and factor', () => {
    const cased = products.find((product) => product.units?.some((unit) => unit.barcode));
    const code = cased?.units?.find((unit) => unit.barcode)?.barcode as string;
    const match = findByBarcode(products, code);
    expect(match?.product.id).toBe(cased?.id);
    expect(match?.factor).toBeGreaterThan(1);
  });
});

describe('lots', () => {
  it('gives every lot-tracked SKU batches at two branches', () => {
    const tracked = products.filter((product) => product.trackLots);
    expect(lots).toHaveLength(tracked.length * 2 * 3);
    expect(new Set(lots.map((lot) => lot.id)).size).toBe(lots.length);
  });

  it('has batches expired, expiring inside 30 days, and safely ahead', () => {
    const cutoff = SEED_NOW.getTime() + 30 * 86_400_000;
    const expired = lots.filter((lot) => (lot.expiresAt as Date).getTime() < SEED_NOW.getTime());
    const soon = lots.filter((lot) => {
      const at = (lot.expiresAt as Date).getTime();
      return at >= SEED_NOW.getTime() && at <= cutoff;
    });
    const later = lots.filter((lot) => (lot.expiresAt as Date).getTime() > cutoff);
    expect(expired.length).toBeGreaterThan(0);
    expect(soon.length).toBeGreaterThan(0);
    expect(later.length).toBeGreaterThan(0);
  });
});

describe('orders', () => {
  it('stamps a channel on every order and walks the whole wholesale lifecycle', () => {
    expect(wholesaleOrders).toHaveLength(10);
    expect(wholesaleOrders.every((order) => order.channel === 'wholesale')).toBe(true);
    expect(new Set(wholesaleOrders.map((order) => order.status))).toEqual(
      new Set(['quote', 'confirmed', 'delivering', 'completed', 'paid']),
    );
  });

  it('gives every order line a cost snapshot and a price source', () => {
    for (const order of wholesaleOrders) {
      for (const line of order.lines) {
        expect(typeof line.unitCostSnapshot).toBe('number');
        expect(line.priceSource).toBeTruthy();
      }
    }
  });

  it('leaves a wholesale order part delivered', () => {
    const byOrder = new Map<string, typeof deliveryNotes>();
    for (const note of deliveryNotes) {
      byOrder.set(note.orderId, [...(byOrder.get(note.orderId) ?? []), note]);
    }
    const partial = [...byOrder.values()].find(
      (notes) =>
        notes.length > 1 &&
        notes.some((note) => note.status === 'delivered') &&
        notes.some((note) => note.status === 'pending'),
    );
    expect(partial).toBeDefined();
  });
});

describe('money', () => {
  it('ships two bank accounts', () => {
    expect(bankAccounts).toHaveLength(2);
  });

  it('leaves six customers owing money, some of it past due', () => {
    const owing = balances(ledgerEntries, 'customer', SEED_NOW).filter((row) => row.balance > 0);
    expect(owing).toHaveLength(6);
    expect(owing.filter((row) => row.overdue > 0).length).toBeGreaterThanOrEqual(2);
  });

  it('leaves four suppliers to be paid, some of it past due', () => {
    const owed = balances(ledgerEntries, 'supplier', SEED_NOW).filter((row) => row.balance > 0);
    expect(owed).toHaveLength(4);
    expect(owed.filter((row) => row.overdue > 0).length).toBeGreaterThanOrEqual(2);
  });

  it('matches the mockup exactly on the Minh Long aging table', () => {
    expect(balanceFor(ledgerEntries, 'customer', MINH_LONG_ID)).toBe(52_400_000);

    const open = openInvoices(ledgerEntries, 'customer', MINH_LONG_ID);
    expect(open.map((row) => row.openAmount)).toEqual([19_400_000, 14_400_000, 18_600_000]);

    const aging = agingFor(ledgerEntries, 'customer', MINH_LONG_ID, SEED_NOW);
    expect(aging.total).toBe(52_400_000);
    expect(aging.current).toBe(18_600_000);
    expect(aging.d1to30 + aging.d31to60 + aging.d61to90 + aging.over90).toBe(33_800_000);

    const minhLong = customers.find((customer) => customer.id === MINH_LONG_ID);
    expect(creditCheck(minhLong!, ledgerEntries, 0).available).toBe(27_600_000);
  });

  it('books a settled wholesale order on both sides so it nets to nothing', () => {
    const settled = wholesaleOrders.find((order) => order.status === 'paid');
    const entries = ledgerEntries.filter((entry) => entry.refId === settled?.id);
    expect(entries).toHaveLength(2);
    expect(entries[0].amount).toBe(entries[1].amount);
  });

  it('stamps a branch on every ledger entry, from the order or receipt where there is one', () => {
    expect(ledgerEntries.every((entry) => Boolean(entry.storeId))).toBe(true);

    const settled = wholesaleOrders.find((order) => order.status === 'paid');
    const orderEntries = ledgerEntries.filter((entry) => entry.refId === settled?.id);
    expect(orderEntries.every((entry) => entry.storeId === settled?.storeId)).toBe(true);

    // More than one branch carries debt, so a per-branch report has something to split.
    expect(new Set(ledgerEntries.map((entry) => entry.storeId)).size).toBeGreaterThan(1);
  });

  it('books each collection to the branch its ledger entry was raised at', () => {
    const byId = new Map(ledgerEntries.map((entry) => [entry.id, entry]));
    const collections = cashBook.filter(
      (entry) => entry.kind === 'collection' || entry.kind === 'supplier_payment',
    );
    expect(collections.length).toBeGreaterThan(0);
    for (const entry of collections) {
      expect(entry.storeId).toBe(byId.get(entry.refId as string)?.storeId);
    }
  });

  it('derives the cash book from orders, shifts and collections', () => {
    expect(cashBook.length).toBeGreaterThan(0);
    expect(new Set(cashBook.map((entry) => entry.id)).size).toBe(cashBook.length);
    const kinds = new Set(cashBook.map((entry) => entry.kind));
    expect(kinds.has('sale')).toBe(true);
    expect(kinds.has('deposit')).toBe(true);
    expect(kinds.has('collection')).toBe(true);
    expect(kinds.has('supplier_payment')).toBe(true);
    expect(cashBook.every((entry) => entry.amount > 0)).toBe(true);
  });
});

describe('costing', () => {
  it('gives every product an opening cost and every received receipt a cost row', () => {
    const opening = costHistory.filter((row) => row.source === 'seed');
    expect(opening).toHaveLength(products.length);

    const receivedLines = goodsReceipts
      .filter((receipt) => receipt.status === 'received')
      .reduce((total, receipt) => total + receipt.lines.length, 0);
    expect(costHistory.filter((row) => row.source === 'receipt')).toHaveLength(receivedLines);
  });

  it('prices receipts off the catalogue cost rather than at it, so the average can move', () => {
    const offCatalogue = goodsReceipts
      .flatMap((receipt) => receipt.lines)
      .filter((line) => {
        const product = products.find((item) => item.id === line.productId);
        return product !== undefined && line.unitCost !== product.costPrice;
      });
    expect(offCatalogue.length).toBeGreaterThan(0);

    // Within a few percent: a supplier moves their price list, they do not double it.
    for (const receipt of goodsReceipts) {
      for (const line of receipt.lines) {
        const product = products.find((item) => item.id === line.productId);
        expect(Math.abs(line.unitCost - product!.costPrice) / product!.costPrice).toBeLessThan(0.06);
      }
    }
  });

  it('moves the weighted average off the opening cost for at least one branch and SKU', () => {
    const opening = new Map(
      costHistory.filter((row) => row.source === 'seed').map((row) => [row.productId, row.unitCost]),
    );
    const moved = costHistory.filter(
      (row) => row.source === 'receipt' && row.unitCost !== opening.get(row.productId),
    );
    expect(moved.length).toBeGreaterThan(0);
  });
});

describe('purchasing, returns and write-offs', () => {
  it('ships five purchase orders, one in each status', () => {
    expect(purchaseOrders).toHaveLength(5);
    expect(purchaseOrders.map((order) => order.status)).toEqual([
      'draft',
      'sent',
      'partial',
      'received',
      'cancelled',
    ]);
  });

  it('leaves the partial order genuinely part received', () => {
    const partial = purchaseOrders.find((order) => order.status === 'partial');
    expect(partial?.lines.some((line) => line.receivedQty === line.qty)).toBe(true);
    expect(partial?.lines.some((line) => line.receivedQty < line.qty)).toBe(true);
  });

  it('ships two supplier returns, one draft and one sent', () => {
    expect(supplierReturns.map((record) => record.status)).toEqual(['draft', 'sent']);
  });

  it('ships three returns and the write-offs their damaged lines produced', () => {
    expect(returnRecords).toHaveLength(3);
    const damagedLines = returnRecords
      .flatMap((record) => record.lines)
      .filter((line) => line.disposition === 'damaged');
    expect(writeOffs).toHaveLength(damagedLines.length);
    expect(writeOffs.length).toBeGreaterThanOrEqual(2);
    expect(writeOffs.every((entry) => entry.refId?.startsWith('return-'))).toBe(true);
  });
});

describe('settings, memberships and notifications', () => {
  it('overrides settings for two branches only', () => {
    expect(storeSettings.map((entry) => entry.storeId)).toEqual(['store-1', 'store-2']);
  });

  it('puts the owner in a second chain so the org switch has a destination', () => {
    const ownerOrgs = memberships
      .filter((membership) => membership.userId === 'account-staff-1')
      .map((membership) => membership.orgId);
    expect(ownerOrgs).toContain(SECOND_ORG_ID);
    expect(ownerOrgs).toHaveLength(2);
    expect(orgDirectory.map((org) => org.id)).toContain(SECOND_ORG_ID);
  });

  it('starts the notification centre with eight rows, two of them read', () => {
    expect(notifications).toHaveLength(8);
    expect(new Set(notifications.map((notification) => notification.id)).size).toBe(8);
    expect(notifications.filter((notification) => notification.readAt)).toHaveLength(2);
    expect(notifications.every((notification) => notification.title && notification.body)).toBe(true);
    // Every body has had its placeholders filled, so no `{token}` reaches a screen.
    expect(notifications.some((notification) => notification.body.includes('{'))).toBe(false);
  });

  it('carries the kind, the template variant and the params each row was built from', () => {
    for (const notification of notifications) {
      expect(notification.params).toBeDefined();
      expect(notification.templateKey).toBeDefined();
      expect(TEMPLATE_KEYS_BY_KIND[notification.kind]).toContain(notification.templateKey);
    }
  });
});

describe('receipts', () => {
  it('books every goods receipt against a supplier record', () => {
    expect(goodsReceipts.every((receipt) => Boolean(receipt.supplierId))).toBe(true);
  });
});
