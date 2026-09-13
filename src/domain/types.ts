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
}

export interface StockLevel {
  productId: string;
  storeId: string;
  onHand: number;
  reserved: number;
  minLevel: number;
}

export type CustomerTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  phone: string;
  points: number;
  tier: CustomerTier;
  totalSpent: number;
  createdAt: string;
}

export interface Discount {
  type: 'percent' | 'amount';
  value: number;
  reason?: string;
}

export interface CartLine {
  productId: string;
  qty: number;
  unitPrice: number;
  lineDiscount?: Discount;
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

export type OrderStatus = 'paid' | 'refunded' | 'partial_refund' | 'void';

export interface Order {
  id: string;
  orgId: string;
  code: string;
  storeId: string;
  cashierId: string;
  customerId?: string;
  lines: CartLine[];
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  total: number;
  payments: Payment[];
  status: OrderStatus;
  createdAt: string;
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
   * Supplier entity the receipt was booked against. Optional until the supplier screens land
   * (wave 2 owns `Supplier` CRUD); `supplierName` stays the display value either way.
   */
  supplierId?: string;
  supplierName: string;
  lines: GoodsReceiptLine[];
  status: GoodsReceiptStatus;
  createdAt: string;
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
