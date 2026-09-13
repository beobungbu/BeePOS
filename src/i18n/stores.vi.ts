import { registerDictionary } from './registry';

export const storesVi = {
  title: 'Cửa hàng',
  validation: {
    required: 'Bắt buộc',
  },
  addStore: 'Thêm cửa hàng',
  editStore: 'Sửa cửa hàng',
  field: {
    code: 'Mã cửa hàng',
    name: 'Tên cửa hàng',
    address: 'Địa chỉ',
    phone: 'Số điện thoại',
    hours: 'Giờ mở cửa',
  },
  status: {
    label: 'Trạng thái',
    active: 'Đang hoạt động',
    inactive: 'Ngừng hoạt động',
  },
  list: {
    staffCount: 'Nhân viên',
    empty: 'Chưa có cửa hàng nào',
  },
  detail: {
    info: 'Thông tin cửa hàng',
    staffAssigned: 'Nhân viên phụ trách',
    todayStats: 'Hôm nay',
    todayOrders: 'Đơn hàng',
    todayRevenue: 'Doanh thu',
    edit: 'Chỉnh sửa',
    save: 'Lưu thay đổi',
    noStaff: 'Chưa có nhân viên phụ trách',
  },
  deactivate: {
    action: 'Ngừng hoạt động',
    activateAction: 'Kích hoạt lại',
    confirmTitle: 'Ngừng hoạt động cửa hàng này?',
    confirmDescription: 'Cửa hàng sẽ ẩn khỏi danh sách bán hàng cho đến khi được kích hoạt lại.',
    confirmAction: 'Ngừng hoạt động',
  },
  settings: {
    title: 'Cài đặt cửa hàng',
    hint: 'Ô nào để trống sẽ dùng giá trị của chuỗi.',
    receiptHeader: 'Tiêu đề hoá đơn',
    receiptFooter: 'Chân hoá đơn',
    taxRate: 'Thuế suất mặc định',
    openingHours: 'Giờ mở cửa',
    printerName: 'Máy in',
    inherit: 'Theo chuỗi',
    inheritValue: 'Theo chuỗi: {value}',
    overrideCount: '{count} mục khác cấu hình chuỗi',
    noOverride: 'Đang theo chuỗi ở mọi mục',
    save: 'Lưu cài đặt cửa hàng',
    reset: 'Xoá cài đặt riêng',
    saved: 'Đã lưu cài đặt cửa hàng',
    cleared: 'Cửa hàng đã quay lại cấu hình chuỗi',
    taxHint: 'Nhập theo phần trăm, ví dụ 10 nghĩa là 10 phần trăm.',
  },
  toast: {
    saved: 'Đã lưu thông tin cửa hàng',
    created: 'Đã tạo cửa hàng mới',
    statusChanged: 'Đã cập nhật trạng thái cửa hàng',
  },
};

registerDictionary('vi', 'stores', storesVi);
