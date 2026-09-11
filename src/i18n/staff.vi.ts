import { registerDictionary } from './registry';

export const staffVi = {
  title: 'Nhân viên',
  validation: {
    required: 'Bắt buộc',
    pinMismatch: 'Hai mã PIN không khớp',
    pinInvalid: 'PIN phải gồm đúng 4 chữ số',
  },
  addStaff: 'Thêm nhân viên',
  editStaff: 'Sửa nhân viên',
  field: {
    name: 'Họ và tên',
    phone: 'Số điện thoại',
    role: 'Vai trò',
    stores: 'Cửa hàng phụ trách',
    active: 'Đang làm việc',
  },
  role: {
    owner: 'Chủ chuỗi',
    manager: 'Quản lý',
    cashier: 'Thu ngân',
  },
  status: {
    active: 'Đang làm việc',
    inactive: 'Đã nghỉ',
  },
  list: {
    empty: 'Chưa có nhân viên nào',
  },
  detail: {
    info: 'Thông tin nhân viên',
    save: 'Lưu thay đổi',
  },
  resetPin: {
    action: 'Đặt lại PIN',
    title: 'Đặt lại mã PIN',
    description: 'Nhập mã PIN mới gồm 4 chữ số cho nhân viên này',
    newPin: 'PIN mới',
    confirmPin: 'Nhập lại PIN mới',
    confirm: 'Xác nhận đặt lại',
    successToast: 'Đã đặt lại mã PIN',
  },
  toast: {
    saved: 'Đã lưu thông tin nhân viên',
    created: 'Đã thêm nhân viên mới',
  },
};

registerDictionary('vi', 'staff', staffVi);
