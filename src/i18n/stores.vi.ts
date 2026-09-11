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
  toast: {
    saved: 'Đã lưu thông tin cửa hàng',
    created: 'Đã tạo cửa hàng mới',
    statusChanged: 'Đã cập nhật trạng thái cửa hàng',
  },
};

registerDictionary('vi', 'stores', storesVi);
