/**
 * Deterministic seeded mock data for BeePOS. Every array is generated from a fixed
 * PRNG seed, so reloading the app always produces the same catalog, stock, and history.
 * No network calls, no faker library. Split by entity to keep each file small and reviewable.
 */

export { organization, DEMO_ORG_ID, DEMO_EMAIL_DOMAIN } from './org';
export { SEED_NOW, daysAgo, daysAhead, daysAgoIso, roundToLabel } from './clock';
export { stores } from './stores';
export { registers } from './registers';
export { accounts, DEMO_PASSWORD, seedSalt } from './accounts';
export { staff } from './staff';
export { categories } from './categories';
export { products } from './products';
export { stockLevels } from './stock';
export { customers, companyCustomers, FIRST_COMPANY_CUSTOMER_INDEX } from './customers';
export { orders, shifts, wholesaleOrders, deliveryNotes } from './orders';
export { suppliers } from './suppliers';
export { storePrices } from './store-prices';
export { auditEvents } from './audit';
export { goodsReceipts, stockTransfers, stockCounts } from './operations';

// Phase 7 commerce data.
export {
  customerGroups,
  priceLists,
  priceRules,
  promotions,
  loyaltyRule,
  RETAIL_GROUP_ID,
  AGENT_A_GROUP_ID,
  AGENT_B_GROUP_ID,
  AGENT_A_PRICE_LIST_ID,
  AGENT_B_PRICE_LIST_ID,
} from './pricing';
export { lots } from './lots';
export { costHistory } from './cost-history';
export { bankAccounts, ledgerEntries, cashBook } from './money';
export { purchaseOrders, supplierReturns } from './purchasing';
export { returnRecords, writeOffs } from './returns';
export { storeSettings } from './store-settings';
export {
  memberships,
  orgDirectory,
  orgsForUser,
  SECOND_ORG_ID,
  SECOND_ORG_STAFF_ID,
} from './memberships';
export { notifications, SEED_NOTIFICATION_LABELS, SEED_NOTIFICATION_COUNT } from './notifications';
