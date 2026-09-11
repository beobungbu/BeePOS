/** Visible labels used by the journey, per locale (kept in sync with src/i18n/*). */
export const L = {
  vi: {
    viewCart: 'Xem giỏ hàng', cartTitle: 'Giỏ hàng', checkout: 'Thanh toán', increaseQty: 'Tăng số lượng',
    lineDiscount: 'Giảm giá dòng', percent: 'Phần trăm', apply: 'Áp dụng', orderDiscount: 'Giảm giá đơn',
    customerDetails: 'Chi tiết', customerDefault: 'Khách lẻ', customerSearch: 'Tìm theo tên hoặc số điện thoại',
    methodCash: 'Tiền mặt', methodTransfer: 'Chuyển khoản', amountReceived: 'Số tiền khách đưa', transferAmount: 'Số tiền chuyển khoản',
    addPayment: 'Thêm khoản thanh toán', confirmPay: 'Xác nhận thanh toán', change: 'Tiền thừa', newSale: 'Bán tiếp',
    openingCash: 'Tiền đầu ca', openShift: 'Mở ca', openShiftNow: 'Mở ca ngay',
    refund: 'Hoàn tiền', refundByLine: 'Hoàn theo dòng', refundIncrease: 'Tăng số lượng hoàn', confirmRefund: 'Xác nhận hoàn tiền', partialRefund: 'Hoàn một phần',
    salePrice: 'Giá bán', rowActions: 'Thao tác', editRow: 'Sửa', save: 'Lưu', productSaved: 'Đã lưu sản phẩm',
    newReceipt: 'Tạo phiếu nhập', supplier: 'Tên nhà cung cấp', addProduct: 'Thêm sản phẩm', receiveGoods: 'Nhận hàng',
    newTransfer: 'Tạo phiếu chuyển', send: 'Gửi hàng', receive: 'Nhận hàng', newCount: 'Tạo phiếu kiểm kê', generate: 'Tạo dòng kiểm kê', post: 'Ghi nhận',
    today: 'Hôm nay', days7: '7 ngày', days30: '30 ngày', custom: 'Tuỳ chọn',
    resetPin: 'Đặt lại PIN', themeLight: 'Sáng', themeDark: 'Tối', language: 'Ngôn ngữ', receiptHeader: 'Tiêu đề hoá đơn',
    tabs: ['Bán hàng', 'Đơn hàng', 'Sản phẩm', 'Kho hàng', 'Thêm'],
  },
  en: {
    viewCart: 'View cart', cartTitle: 'Cart', checkout: 'Checkout', increaseQty: 'Increase quantity',
    lineDiscount: 'Line discount', percent: 'Percent', apply: 'Apply', orderDiscount: 'Order discount',
    customerDetails: 'Details', customerDefault: 'Walk-in customer', customerSearch: 'Search by name or phone',
    methodCash: 'Cash', methodTransfer: 'Transfer', amountReceived: 'Amount received', transferAmount: 'Transfer amount',
    addPayment: 'Add payment', confirmPay: 'Confirm payment', change: 'Change', newSale: 'New sale',
    openingCash: 'Opening cash', openShift: 'Open shift', openShiftNow: 'Open shift now',
    refund: 'Refund', refundByLine: 'Refund by line', refundIncrease: 'Increase refund quantity', confirmRefund: 'Confirm refund', partialRefund: 'Partially refunded',
    salePrice: 'Sale price', rowActions: 'Actions', editRow: 'Edit', save: 'Save', productSaved: 'Product saved',
    newReceipt: 'New receipt', supplier: 'Supplier name', addProduct: 'Add product', receiveGoods: 'Receive goods',
    newTransfer: 'New transfer', send: 'Send', receive: 'Receive', newCount: 'New count', generate: 'Generate lines', post: 'Post count',
    today: 'Today', days7: '7 days', days30: '30 days', custom: 'Custom',
    resetPin: 'Reset PIN', themeLight: 'Light', themeDark: 'Dark', language: 'Language', receiptHeader: 'Receipt header',
    tabs: ['Sell', 'Orders', 'Products', 'Inventory', 'More'],
  },
} as const;
export type Locale = keyof typeof L;
