/** Core domain model for BeePOS. Pure types, no runtime dependencies. */

/**
 * The chain a set of stores, staff and data belongs to. Every root entity carries `orgId`, so
 * one device can only ever read the chain its session was issued for.
 */
export interface Organization {
  id: string;
  code: string;
  name: string;
  plan: 'free' | 'pro' | 'enterprise';
  currency: 'VND';
  /** Mã số thuế of the chain, printed as the seller tax code on a VAT invoice. */
  taxCode?: string;
  taxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  createdAt: Date;
}

export interface Store {
  id: string;
  orgId: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface Staff {
  id: string;
  orgId: string;
  name: string;
  role: StaffRole;
  storeIds: string[];
  pin: string;
}

export interface Category {
  id: string;
  orgId: string;
  name: string;
  parentId?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  salePrice: number;
}

export interface Product {
  id: string;
  orgId: string;
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  /**
   * The size or pack this SKU is, when the product line has several (`330ml`, `Lốc 6 lon`).
   * The tile and the cart line read it with the unit as one caption (`330ml · chai`); a
   * product without one shows the unit alone.
   */
  variantLabel?: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  taxRate: number;
  /**
   * Remote URL, or the number a bundler `require()` returns for a bundled asset. Seed data
   * ships bundled photos; a real catalogue would carry URLs.
   */
  imageUrl?: string | number;
  isActive: boolean;
  variants?: ProductVariant[];
  /**
   * Larger selling units this SKU is also sold in (`thùng`, `lốc`), each with how many base
   * units it contains. `unit` above stays the base; absence means the base unit is the only one.
   */
  units?: UnitConversion[];
  /**
   * Extra codes that scan to this product beyond `barcode`: a repacked carton, a supplier's
   * own label, the code printed on the case. Scanned lookups search both.
   */
  barcodes?: string[];
  /** Smallest quantity a wholesale order may take, in base units. Retail ignores it. */
  minOrderQty?: number;
  /** Whether receipts of this product are broken into lots with an expiry date. */
  trackLots?: boolean;
}

/**
 * One larger unit of a product and how many base units it holds: `{ unit: 'thùng', factor: 24 }`
 * on a 24-can case. `barcode` is the code printed on that packaging, when it has its own.
 */
export interface UnitConversion {
  unit: string;
  factor: number;
  barcode?: string;
}

export interface StockLevel {
  productId: string;
  storeId: string;
  onHand: number;
  reserved: number;
  minLevel: number;
}

export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Whether the account buys over the counter or on a company invoice. `company` is what turns
 * the wholesale switch, the tax-code fields and the credit limit on at the till.
 */
export type CustomerType = 'retail' | 'company';

/**
 * A pricing cohort ("Lẻ", "Đại lý A"). `discountPercent` is the blanket discount every member
 * gets; `priceListId` points at the per-product list that outranks it.
 */
export interface CustomerGroup {
  id: string;
  orgId: string;
  name: string;
  discountPercent: number;
  priceListId?: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  points: number;
  tier: CustomerTier;
  totalSpent: number;
  createdAt: string;
  /** Required: a record with no type would price as neither retail nor wholesale. */
  type: CustomerType;
  groupId?: string;
  /** Mã số thuế, printed on the VAT invoice. */
  taxCode?: string;
  companyName?: string;
  contactName?: string;
  deliveryAddress?: string;
  /**
   * Where the VAT invoice is addressed, when that differs from where the goods go. Kept apart
   * from `deliveryAddress` because a buyer's registered office and their warehouse are often
   * two places, and one field would be wrong on half the invoices.
   */
  billingAddress?: string;
  /** Staff member who owns the account, for the sales-by-rep report. */
  salesRepId?: string;
  /** Ceiling on the unpaid receivable balance; 0 or absent means no credit is allowed. */
  creditLimit?: number;
  /** Days after an on-account invoice before it is overdue. */
  paymentTermDays?: number;
}

/** A named set of per-product prices. Attached to a customer group or to a customer directly. */
export interface PriceList {
  id: string;
  orgId: string;
  name: string;
  isActive: boolean;
}

/**
 * One priced row. `customerId` set makes it a customer-specific price (the highest
 * precedence); `minQty` above 1 makes it a quantity tier. Prices are per base unit.
 */
export interface PriceRule {
  id: string;
  orgId: string;
  priceListId?: string;
  customerId?: string;
  productId: string;
  minQty: number;
  unitPrice: number;
}

export type PromotionType = 'percent' | 'amount' | 'buy_x_get_y';

/**
 * An automatic price reduction inside a time window. Scope narrows by product, category and
 * store; an empty scope array means "everything". `stackable` decides whether it can be
 * combined with other promotions or has to win on its own.
 */
export interface Promotion {
  id: string;
  orgId: string;
  name: string;
  type: PromotionType;
  /** Percent off for `percent`, dong off per unit for `amount`, unused for `buy_x_get_y`. */
  value: number;
  buyQty?: number;
  getQty?: number;
  productIds?: string[];
  categoryIds?: string[];
  storeIds?: string[];
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  stackable: boolean;
}

/** Chain-wide loyalty maths, so earn and redeem rates stop being constants in the code. */
export interface LoyaltyRule {
  orgId: string;
  /** Points earned per dong spent (1/10_000 means one point per 10.000 đ). */
  earnPerVnd: number;
  /** Dong a single point redeems for. */
  redeemVndPerPoint: number;
  tierThresholds: Record<Exclude<CustomerTier, 'bronze'>, number>;
  /**
   * Earn rate multiplier per tier: `amount * earnPerVnd * tierMultiplier[tier]`. Absent, or a
   * tier missing from it, means 1, so a chain that does not reward tiers writes nothing here.
   */
  tierMultiplier?: Record<CustomerTier, number>;
}

export interface Discount {
  type: 'percent' | 'amount';
  value: number;
  reason?: string;
}

/**
 * Where a line's unit price came from. The first six are the precedence chain
 * `src/domain/pricing.ts` walks, highest first:
 *
 *   `customer`        a price rule naming this buyer and this product
 *   `tier`            a quantity tier on the group's price list
 *   `group`           a flat row on the group's price list
 *   `group_discount`  the group's blanket percentage off
 *   `store`           a branch price override
 *   `list`            the catalogue price
 *
 * `promotion` replaces whichever of those won when a promotion lowered it further, and
 * `manual` is a price the cashier typed over the top.
 */
export type PriceSource =
  | 'customer'
  | 'tier'
  | 'group'
  | 'group_discount'
  | 'store'
  | 'list'
  | 'promotion'
  | 'manual';

/**
 * A line while it is still in the cart. The costing and pricing fields are optional here and
 * required on {@link OrderLine}: a line only has to know what it cost and where its price came
 * from at the moment it is sold, and `addOrIncrementLine` has neither to hand.
 */
export interface CartLine {
  productId: string;
  qty: number;
  unitPrice: number;
  lineDiscount?: Discount;
  /** The product's weighted-average cost when the line was priced. Frozen for gross profit. */
  unitCostSnapshot?: number;
  /** Selling unit the qty is counted in; absent means the product's base unit. */
  unit?: string;
  /** Base units per `unit`. Absent (or 1) means the qty is already in base units. */
  unitFactor?: number;
  /** The promotion that produced `unitPrice`, when one did. */
  promotionId?: string;
  priceSource?: PriceSource;
}

/**
 * A line as it is booked onto an order. Same shape as a cart line with the two fields a sold
 * line may not be missing: the cost it is measured against and the price source it is
 * explained by.
 */
export interface OrderLine extends CartLine {
  unitCostSnapshot: number;
  priceSource: PriceSource;
}

export interface Cart {
  id: string;
  /**
   * 1-based number the cashier sees on the open-order tab ("Đơn 3"). Unique among the open
   * carts, reused once a cart is closed, and always the smallest free number on open.
   */
  ordinal: number;
  /**
   * Cashier-given name for the order ("Chị Lan", "Bàn 3"). When set it replaces "Đơn N"
   * everywhere the order is named; the ordinal stays the identity underneath.
   */
  label?: string;
  storeId: string;
  lines: CartLine[];
  customerId?: string;
  discount?: Discount;
  note?: string;
}

export type PaymentMethod = 'cash' | 'transfer' | 'card' | 'points';

export interface Payment {
  method: PaymentMethod;
  amount: number;
  ref?: string;
}

/** Whether the order was rung up over the counter or sold wholesale on the "Bán sỉ" switch. */
export type OrderChannel = 'retail' | 'wholesale';

/**
 * Retail sells straight into `paid`. Wholesale walks the lifecycle
 * `quote -> confirmed -> delivering -> completed -> paid`, and either branch can end in
 * `cancelled` (never delivered) or `void` (rung up in error). `src/domain/lifecycle.ts` owns
 * which move is legal from where.
 */
export type OrderStatus =
  | 'quote'
  | 'confirmed'
  | 'delivering'
  | 'completed'
  | 'paid'
  | 'refunded'
  | 'partial_refund'
  | 'void'
  | 'cancelled';

/** The buyer's details as they must appear on a VAT invoice. */
export interface VatInvoiceInfo {
  buyerName: string;
  taxCode: string;
  address: string;
  email?: string;
}

export interface Order {
  id: string;
  orgId: string;
  code: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  lines: OrderLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: Payment[];
  status: OrderStatus;
  createdAt: string;
  /** Required: every order is one or the other, and the reports split on it. */
  channel: OrderChannel;
  salesRepId?: string;
  /** When an on-account balance falls due; set from the customer's payment term. */
  dueDate?: Date;
  vatInvoice?: VatInvoiceInfo;
  /** Overrides the customer's default delivery address for this order only. */
  deliveryAddress?: string;
}

/**
 * One delivery against a wholesale order. An order delivered in two trips has two notes, and
 * the sum of their line quantities is what "partially delivered" means.
 */
export interface DeliveryNote {
  id: string;
  orgId: string;
  orderId: string;
  lines: { productId: string; qty: number }[];
  status: 'pending' | 'delivered';
  deliveredAt?: Date;
}

export interface Shift {
  id: string;
  orgId: string;
  storeId: string;
  /**
   * The till the shift was opened on. Optional because shifts seeded before registers existed
   * carry none; a session always binds one before a shift can be opened.
   */
  registerId?: string;
  cashierId: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  closingCash?: number;
  expectedCash: number;
  orderCount: number;
  revenue: number;
}

export interface GoodsReceiptLine {
  productId: string;
  qty: number;
  unitCost: number;
}

export type GoodsReceiptStatus = 'draft' | 'received';

export interface GoodsReceipt {
  id: string;
  orgId: string;
  storeId: string;
  /**
   * Supplier entity the receipt was booked against. Required: a receipt with only a typed-in
   * name posts to no payables account and shows up in no partner's purchase history, so the
   * display name is read off the `Supplier` record instead of copied onto the receipt.
   */
  supplierId: string;
  lines: GoodsReceiptLine[];
  status: GoodsReceiptStatus;
  createdAt: string;
  /** Purchase order this receipt fulfils, when it was raised from one. */
  purchaseOrderId?: string;
}

export type StockTransferStatus = 'draft' | 'sent' | 'received';

export interface StockTransfer {
  id: string;
  orgId: string;
  fromStoreId: string;
  toStoreId: string;
  lines: GoodsReceiptLine[];
  status: StockTransferStatus;
  createdAt: string;
}

export interface StockCountLine {
  productId: string;
  counted: number;
  expected: number;
}

export type StockCountStatus = 'draft' | 'posted';

export interface StockCount {
  id: string;
  orgId: string;
  storeId: string;
  lines: StockCountLine[];
  status: StockCountStatus;
  createdAt: string;
}

/**
 * A till: one physical station inside a store. A session binds to one, so two cashiers on two
 * tills in the same shop are told apart on the shift and on the receipt.
 */
export interface Register {
  id: string;
  orgId: string;
  storeId: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Everything a role may be allowed to do. Screens ask `can(role, permission)`, never the role. */
export type Permission =
  | 'pos.sell'
  | 'pos.refund'
  | 'pos.discount'
  | 'pos.void'
  | 'orders.view'
  | 'catalog.manage'
  | 'inventory.manage'
  | 'inventory.transfer'
  | 'customers.manage'
  | 'reports.store'
  | 'reports.chain'
  | 'stores.manage'
  | 'staff.manage'
  | 'settings.manage'
  | 'audit.view'
  | 'cash.movement';

export interface RoleDefinition {
  role: StaffRole;
  label: string;
  permissions: Permission[];
}

export type UserAccountStatus = 'active' | 'invited' | 'disabled';

/**
 * Sign-in identity. Separate from `Staff` on purpose: a staff record is who works the till
 * (name, PIN, branches), an account is who may sign in (email, password, invite state).
 */
export interface UserAccount {
  id: string;
  orgId: string;
  email: string;
  passwordHash: string;
  salt: string;
  staffId: string;
  status: UserAccountStatus;
  mustChangePassword: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
}

export interface Session {
  token: string;
  orgId: string;
  userId: string;
  staffId: string;
  storeId?: string;
  registerId?: string;
  issuedAt: Date;
  expiresAt: Date;
  /** Set while the screen is locked; the session stays valid and a PIN brings it back. */
  lockedAt?: Date;
}

export interface Supplier {
  id: string;
  orgId: string;
  name: string;
  phone?: string;
  address?: string;
  /**
   * Days of credit the partner gives. A goods receipt taken on credit is due this many days
   * after it is confirmed; absent means the bill carries no due date, so the payables screen
   * shows it as "no due date" rather than inventing one.
   */
  paymentTermDays?: number;
  note?: string;
  isActive: boolean;
}

/** Per-store override of a product's sale price; absence means the catalogue price applies. */
export interface StorePrice {
  orgId: string;
  storeId: string;
  productId: string;
  salePrice: number;
}

export type CashMovementType = 'in' | 'out';

export interface CashMovement {
  id: string;
  orgId: string;
  storeId: string;
  shiftId: string;
  type: CashMovementType;
  amount: number;
  reason: string;
  staffId: string;
  createdAt: Date;
}

export interface AuditEvent {
  id: string;
  orgId: string;
  storeId?: string;
  staffId: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  createdAt: Date;
}

/* ---------------------------------------------------------------------------------------
 * Money: receivables, payables, the bank and the cash book.
 *
 * One ledger for both sides. A customer invoice and a supplier bill are the same arithmetic
 * with the party swapped, so they share a table and `src/domain/ledger.ts` reads either.
 * ------------------------------------------------------------------------------------ */

export type LedgerParty = 'customer' | 'supplier';

/** What the entry is. `invoice` and `debit_note` raise the balance, the other two lower it. */
export type LedgerKind = 'invoice' | 'payment' | 'credit_note' | 'debit_note';

export type LedgerRefType = 'order' | 'receipt' | 'return' | 'manual';

export interface LedgerEntry {
  id: string;
  orgId: string;
  party: LedgerParty;
  partyId: string;
  /**
   * Branch the entry was raised at. Optional because a chain-level invoice belongs to no one
   * shop; when it is set, the debt reports can be read per branch instead of only per chain.
   */
  storeId?: string;
  kind: LedgerKind;
  refType: LedgerRefType;
  refId?: string;
  /** Always positive; `kind` carries the direction. */
  amount: number;
  /** Only invoices and debit notes fall due; a payment has no due date. */
  dueDate?: Date;
  createdAt: Date;
  note?: string;
}

export interface BankAccount {
  id: string;
  orgId: string;
  name: string;
  number: string;
  bank: string;
}

/**
 * Every movement of money at a store, across shifts. `sale` and `refund` are booked from
 * orders, the rest are typed in or posted by the collection and payment screens.
 */
export type CashBookKind =
  | 'sale'
  | 'refund'
  | 'in'
  | 'out'
  | 'deposit'
  | 'collection'
  | 'supplier_payment';

export interface CashBookEntry {
  id: string;
  orgId: string;
  storeId: string;
  kind: CashBookKind;
  /** Always positive; `kind` says which way the money went. */
  amount: number;
  refId?: string;
  /** Set on a `deposit`, and on any entry settled through the bank rather than the drawer. */
  bankAccountId?: string;
  staffId: string;
  createdAt: Date;
}

/** Where a cost figure came from. `seed` marks the opening cost of the demo catalogue. */
export type CostSource = 'receipt' | 'manual' | 'seed';

/** One point on a product's cost curve. The newest row is the weighted-average cost in force. */
export interface CostHistory {
  productId: string;
  /** Absent for a chain-wide cost; set when a branch buys at its own price. */
  storeId?: string;
  unitCost: number;
  source: CostSource;
  refId?: string;
  createdAt: Date;
}

/* ---------------------------------------------------------------------------------------
 * Returns, exchanges and write-offs.
 * ------------------------------------------------------------------------------------ */

/** Where a returned unit goes: back on the shelf, or onto the write-off log. */
export type ReturnDisposition = 'restock' | 'damaged';

export interface ReturnLine {
  productId: string;
  qty: number;
  reason: string;
  disposition: ReturnDisposition;
  unitPrice: number;
}

export interface ReturnRecord {
  id: string;
  orgId: string;
  storeId: string;
  orderId: string;
  lines: ReturnLine[];
  refundAmount: number;
  /** The replacement order, when the return was half of an exchange. */
  exchangeOrderId?: string;
  /** The ledger credit note, when a delivered wholesale order was returned on account. */
  creditNoteId?: string;
  staffId: string;
  createdAt: Date;
}

/** Stock removed for a reason other than a sale: damaged, expired, lost. Never restocked. */
export interface WriteOff {
  id: string;
  orgId: string;
  storeId: string;
  productId: string;
  qty: number;
  reason: string;
  refId?: string;
  staffId: string;
  createdAt: Date;
}

/* ---------------------------------------------------------------------------------------
 * Purchasing and lots.
 * ------------------------------------------------------------------------------------ */

export type PurchaseOrderStatus = 'draft' | 'sent' | 'partial' | 'received' | 'cancelled';

export interface PurchaseOrderLine {
  productId: string;
  qty: number;
  /** How much of `qty` has arrived. `partial` is the state where 0 < receivedQty < qty. */
  receivedQty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  orgId: string;
  storeId: string;
  supplierId: string;
  code: string;
  lines: PurchaseOrderLine[];
  status: PurchaseOrderStatus;
  expectedAt?: Date;
  createdAt: Date;
}

export interface SupplierReturnLine {
  productId: string;
  qty: number;
  unitCost: number;
  reason: string;
}

export interface SupplierReturn {
  id: string;
  orgId: string;
  storeId: string;
  supplierId: string;
  /** The receipt the goods arrived on, when the return is traceable to one. */
  receiptId?: string;
  lines: SupplierReturnLine[];
  status: 'draft' | 'sent';
  createdAt: Date;
}

/**
 * A batch of one product at one store, with the expiry the FEFO picker sorts on. Only
 * products flagged `trackLots` have them.
 */
export interface Lot {
  id: string;
  orgId: string;
  storeId: string;
  productId: string;
  lotCode: string;
  expiresAt?: Date;
  onHand: number;
  receiptId?: string;
}

/* ---------------------------------------------------------------------------------------
 * Per-store settings, org membership and the notification centre.
 * ------------------------------------------------------------------------------------ */

/**
 * Overrides of the chain defaults for one branch. Every field is optional: an absent value
 * means "use the organization's".
 */
export interface StoreSettings {
  storeId: string;
  receiptHeader?: string;
  receiptFooter?: string;
  taxRate?: number;
  openingHours?: string;
  printerName?: string;
}

/**
 * One account's place in one chain. A person who runs two chains has two memberships and a
 * different staff record in each, which is what the org switch swaps between.
 */
export interface OrgMembership {
  userId: string;
  orgId: string;
  staffId: string;
}

/**
 * Enough of another chain to list it in the org switcher without loading its data. Beyond the
 * frozen contract, and deliberately so: persistence is namespaced per chain, so the switcher
 * cannot read a second `Organization` record out of the slice it is about to switch away from.
 */
export interface OrgSummary {
  id: string;
  code: string;
  name: string;
  storeCount: number;
}

export type NotificationKind =
  | 'low_stock'
  | 'expiring_lot'
  | 'shift_open'
  | 'overdue_receivable'
  | 'po_awaiting';

export interface AppNotification {
  id: string;
  orgId: string;
  storeId?: string;
  kind: NotificationKind;
  /** Rendered copy, for a caller that has no dictionary to hand. See `params` first. */
  title: string;
  body: string;
  /**
   * The values the rule computed (`product`, `store`, `onHand`, `days`, `overdue`, ...), so a
   * screen can render `kind` + `params` through its own dictionary rather than being stuck with
   * the string that happened to be in force when the row was written. A row persisted in
   * Vietnamese and read back after a language switch is exactly that problem.
   */
  params?: Record<string, string | number>;
  /**
   * Which rule variant produced the row, where a kind has more than one. `low_stock` is
   * `lowStock` or `outOfStock`; the rest name their kind.
   */
  templateKey?: string;
  refType?: string;
  refId?: string;
  readAt?: Date;
  createdAt: Date;
}
