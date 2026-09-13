/** Visible labels used by the journey, per locale (kept in sync with src/i18n/*). */
export const L = {
  vi: {
    viewCart: 'Xem giỏ hàng', checkout: 'Thanh toán', increaseQty: 'Tăng số lượng',
    lineDiscount: 'Giảm giá dòng', percent: 'Phần trăm', apply: 'Áp dụng', orderDiscount: 'Giảm giá đơn',
    customerDefault: 'Khách lẻ', customerSearch: 'Tìm theo tên hoặc số điện thoại',
    methodCash: 'Tiền mặt', methodTransfer: 'Chuyển khoản', amountReceived: 'Tiền khách đưa', transferAmount: 'Số tiền chuyển khoản',
    addPayment: 'Thêm thanh toán', confirmPay: 'Hoàn tất', change: 'Tiền thừa', newSale: 'Bán tiếp',
    openingCash: 'Tiền đầu ca', openShift: 'Mở ca', orderTab: 'Đơn 1', newOrder: 'Mở đơn mới',
    refund: 'Hoàn tiền', refundByLine: 'Hoàn theo dòng', refundIncrease: 'Tăng số lượng hoàn', confirmRefund: 'Xác nhận hoàn tiền', partialRefund: 'Hoàn một phần',
    salePrice: 'Giá bán', rowActions: 'Thao tác', editRow: 'Sửa', save: 'Lưu', productSaved: 'Đã lưu sản phẩm',
    newReceipt: 'Tạo phiếu nhập', supplier: 'Nhà cung cấp', addProduct: 'Thêm sản phẩm', receiveGoods: 'Nhận hàng',
    newTransfer: 'Tạo phiếu chuyển', send: 'Gửi hàng', receive: 'Nhận hàng', newCount: 'Tạo phiếu kiểm kê', generate: 'Tạo dòng kiểm kê', post: 'Ghi nhận',
    today: 'Hôm nay', days7: '7 ngày', days30: '30 ngày', custom: 'Tuỳ chọn',
    resetPin: 'Đặt lại PIN', themeLight: 'Sáng', themeDark: 'Tối', language: 'Ngôn ngữ', receiptHeader: 'Tiêu đề hoá đơn',
    signIn: 'Đăng nhập', email: 'Email', password: 'Mật khẩu', selectStore: 'Chọn cửa hàng', selectRegister: 'Chọn quầy',
    lock: 'Khoá màn hình', unlockPrompt: 'Nhập mã PIN 4 chữ số để mở khoá', switchCashier: 'Đổi thu ngân',
    staff: 'Nhân viên', permissionsMatrix: 'Ma trận quyền', invite: 'Mời qua email', statusInvited: 'Đã mời',
    tabs: ['Bán hàng', 'Đơn hàng', 'Sản phẩm', 'Kho hàng', 'Thêm'],
  },
  en: {
    viewCart: 'View cart', checkout: 'Checkout', increaseQty: 'Increase quantity',
    lineDiscount: 'Line discount', percent: 'Percent', apply: 'Apply', orderDiscount: 'Order discount',
    customerDefault: 'Walk-in customer', customerSearch: 'Search by name or phone',
    methodCash: 'Cash', methodTransfer: 'Transfer', amountReceived: 'Cash received', transferAmount: 'Transfer amount',
    addPayment: 'Add payment', confirmPay: 'Complete', change: 'Change', newSale: 'Next sale',
    openingCash: 'Opening cash', openShift: 'Open shift', orderTab: 'Order 1', newOrder: 'New order',
    refund: 'Refund', refundByLine: 'Refund by line', refundIncrease: 'Increase refund quantity', confirmRefund: 'Confirm refund', partialRefund: 'Partially refunded',
    salePrice: 'Sale price', rowActions: 'Actions', editRow: 'Edit', save: 'Save', productSaved: 'Product saved',
    newReceipt: 'New receipt', supplier: 'Supplier', addProduct: 'Add product', receiveGoods: 'Receive goods',
    newTransfer: 'New transfer', send: 'Send', receive: 'Receive', newCount: 'New count', generate: 'Generate lines', post: 'Post count',
    today: 'Today', days7: '7 days', days30: '30 days', custom: 'Custom',
    resetPin: 'Reset PIN', themeLight: 'Light', themeDark: 'Dark', language: 'Language', receiptHeader: 'Receipt header',
    signIn: 'Sign in', email: 'Email', password: 'Password', selectStore: 'Select store', selectRegister: 'Pick a register',
    lock: 'Lock screen', unlockPrompt: 'Enter your 4 digit PIN to unlock', switchCashier: 'Switch cashier',
    staff: 'Staff', permissionsMatrix: 'Permission matrix', invite: 'Invite by email', statusInvited: 'Invited',
    tabs: ['Sell', 'Orders', 'Products', 'Inventory', 'More'],
  },
} as const;
export type Locale = keyof typeof L;

/**
 * Commerce (phase 7) sales and pricing labels, Vietnamese only: `commerce-sales.spec.ts`
 * runs in the default locale, as every feature spec after the journey does. Kept in its own
 * block so the journey's per-locale dictionary above stays a pair of mirrored objects.
 */
export const C = {
  // POS wholesale
  wholesale: 'Bán sỉ',
  wholesaleBadge: 'Sỉ',
  attachCustomer: 'Gắn khách hàng',
  changeCustomer: 'Đổi khách hàng',
  customerSearch: 'Tìm theo tên hoặc số điện thoại',
  saveQuote: 'Lưu báo giá',
  checkout: 'Thanh toán',
  onAccount: 'Ghi nợ',
  creditLeft: 'Còn được nợ sau đơn này',
  vatInvoice: 'Hoá đơn VAT',
  groupPrice: 'Giá sỉ nhóm',
  contractPrice: 'Giá riêng',
  // Customers
  customerTypeCompany: 'Công ty',
  debtTab: 'Công nợ',
  debtBalance: 'Đang nợ',
  pricingLink: 'Giá bán',
  // Pricing
  pricingTitle: 'Giá bán',
  tabPriceLists: 'Bảng giá',
  tabGroups: 'Nhóm khách',
  addRule: 'Thêm quy tắc',
  ruleSearch: 'Tìm sản phẩm trong bảng giá',
  minQty: 'SL tối thiểu',
  unitPrice: 'Đơn giá',
  vsBase: 'So với giá gốc',
  save: 'Lưu',
  precedence: 'Thứ tự ưu tiên',
  listAgentA: 'Bảng giá Đại lý A',
  // Order lifecycle
  advanceTo: 'Chuyển sang',
  statusConfirmed: 'Đã xác nhận',
  statusDelivering: 'Đang giao',
  statusCompleted: 'Đã giao',
  createDeliveryNote: 'Tạo phiếu giao hàng',
  markDelivered: 'Xác nhận đã giao',
  deliveryNotes: 'Phiếu giao hàng',
  cancelOrder: 'Huỷ đơn',
  printVatInvoice: 'In hoá đơn VAT',
} as const;

/** Seed rows the commerce spec acts on, from `src/data/seed`. */
export const MINH_LONG = 'Cty TNHH Thương mại Minh Long';
export const MINH_LONG_ID = 'customer-41';
/** Two SKUs on the Đại lý A price list: the first also carries selling units. */
export const WHOLESALE_PRODUCT_UNITS = 'Nước ngọt Coca-Cola 330ml';
export const WHOLESALE_PRODUCT_GROUP = 'Nước ngọt Coca-Cola 500ml';
