/** Core domain model for BeePOS. Pure types, no runtime dependencies. */

export interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
}

export type StaffRole = 'owner' | 'manager' | 'cashier';

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  storeIds: string[];
  pin: string;
}

export interface Category {
  id: string;
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
  sku: string;
  barcode: string;
  name: string;
  description?: string;
  categoryId: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  taxRate: number;
  imageUrl?: string;
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
  storeId: string;
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
  storeId: string;
  supplierName: string;
  lines: GoodsReceiptLine[];
  status: GoodsReceiptStatus;
  createdAt: string;
}

export type StockTransferStatus = 'draft' | 'sent' | 'received';

export interface StockTransfer {
  id: string;
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
  storeId: string;
  lines: StockCountLine[];
  status: StockCountStatus;
  createdAt: string;
}
