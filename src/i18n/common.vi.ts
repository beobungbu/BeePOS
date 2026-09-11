import { registerDictionary } from './registry';

export const commonVi = {
  nav: {
    pos: 'Bán hàng',
    orders: 'Đơn hàng',
    products: 'Sản phẩm',
    inventory: 'Kho hàng',
    customers: 'Khách hàng',
    reports: 'Báo cáo',
    stores: 'Cửa hàng',
    staff: 'Nhân viên',
    settings: 'Cài đặt',
    more: 'Thêm',
  },
  actions: {
    save: 'Lưu',
    cancel: 'Huỷ',
    confirm: 'Xác nhận',
    delete: 'Xoá',
    edit: 'Sửa',
    add: 'Thêm mới',
    search: 'Tìm kiếm',
    back: 'Quay lại',
    next: 'Tiếp theo',
    apply: 'Áp dụng',
    close: 'Đóng',
  },
  auth: {
    storeCode: 'Mã cửa hàng',
    pin: 'Mã PIN',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
    selectStore: 'Chọn cửa hàng',
    invalidCredentials: 'Mã cửa hàng hoặc mã PIN không đúng',
    welcome: 'Chào mừng đến với BeePOS',
    continueButton: 'Tiếp tục',
  },
  shell: {
    switchStore: 'Đổi cửa hàng',
    profile: 'Tài khoản',
    theme: 'Giao diện',
    language: 'Ngôn ngữ',
    themeLight: 'Sáng',
    themeDark: 'Tối',
    themeSystem: 'Theo hệ thống',
  },
};

registerDictionary('vi', 'common', commonVi);
