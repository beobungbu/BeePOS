import { registerDictionary } from './registry';

export const reportsVi = {
  title: 'Báo cáo',
  subtitle: 'Tổng quan doanh thu và hiệu suất chuỗi cửa hàng',
  period: {
    today: 'Hôm nay',
    last7: '7 ngày',
    last30: '30 ngày',
    custom: 'Tuỳ chọn',
    from: 'Từ ngày',
    to: 'Đến ngày',
    apply: 'Áp dụng',
  },
  storeFilter: {
    label: 'Cửa hàng',
    all: 'Tất cả cửa hàng',
  },
  stat: {
    revenue: 'Doanh thu',
    orders: 'Đơn hàng',
    avgBasket: 'Giá trị TB/đơn',
    grossProfit: 'Lợi nhuận gộp',
    refunds: 'Hoàn tiền',
    vsPrevious: 'so với kỳ trước',
  },
  section: {
    revenueByDay: 'Doanh thu theo ngày',
    revenueByStore: 'Theo cửa hàng',
    topProducts: 'Top 10 sản phẩm',
    paymentMix: 'Phương thức thanh toán',
    cashierPerformance: 'Thu ngân',
  },
  table: {
    store: 'Cửa hàng',
    orders: 'Đơn hàng',
    revenue: 'Doanh thu',
    share: 'Tỷ trọng',
    product: 'Sản phẩm',
    qty: 'SL',
    method: 'Phương thức',
    amount: 'Số tiền',
    cashier: 'Thu ngân',
    avg: 'TB/đơn',
  },
  paymentMethod: {
    cash: 'Tiền mặt',
    transfer: 'Chuyển khoản',
    card: 'Thẻ',
    points: 'Điểm thưởng',
  },
  export: {
    button: 'Xuất báo cáo',
    toastTitle: 'Đã xuất báo cáo',
    toastDescription: 'Tệp báo cáo đã sẵn sàng để tải xuống',
  },
  empty: {
    noData: 'Không có dữ liệu trong khoảng thời gian này',
  },
};

registerDictionary('vi', 'reports', reportsVi);
