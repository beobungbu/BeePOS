import { registerDictionary } from './registry';

export const settingsVi = {
  section: {
    appearance: 'Giao diện',
    language: 'Ngôn ngữ',
    defaultStore: 'Cửa hàng mặc định',
    receipt: 'Hoá đơn',
    tax: 'Thuế',
    payment: 'Thanh toán',
    printer: 'Máy in',
    about: 'Về ứng dụng',
    account: 'Tài khoản',
  },
  density: {
    label: 'Mật độ hiển thị',
    comfortable: 'Thoải mái',
    compact: 'Gọn',
  },
  defaultStore: {
    label: 'Cửa hàng mặc định khi mở ứng dụng',
  },
  receipt: {
    header: 'Tiêu đề hoá đơn',
    headerPlaceholder: 'Ví dụ: Tạp hoá Cầu Giấy',
    footer: 'Chân trang hoá đơn',
    footerPlaceholder: 'Ví dụ: Cảm ơn quý khách, hẹn gặp lại',
    showLogo: 'Hiển thị logo trên hoá đơn',
    preview: 'Xem trước hoá đơn',
    previewSample: 'Sữa tươi TH true MILK x2',
  },
  tax: {
    label: 'Thuế suất mặc định',
  },
  payment: {
    bankName: 'Ngân hàng',
    bankNamePlaceholder: 'Ví dụ: Vietcombank',
    accountNumber: 'Số tài khoản',
    accountHolder: 'Chủ tài khoản',
    vietqrNote: 'Thông tin dùng để tạo mã VietQR khi thanh toán chuyển khoản',
  },
  printer: {
    label: 'Máy in hoá đơn',
    none: 'Chưa chọn máy in',
    testPrint: 'In thử',
    testPrintToast: 'Đã gửi lệnh in thử',
    testPrintNoneToast: 'Vui lòng chọn máy in trước khi in thử',
  },
  about: {
    appVersion: 'Phiên bản BeePOS',
    beeuiVersion: 'Phiên bản BeeUI',
    expoSdk: 'Expo SDK',
  },
  logout: {
    action: 'Đăng xuất',
    confirmTitle: 'Đăng xuất khỏi BeePOS?',
    confirmDescription: 'Bạn sẽ cần nhập lại mã cửa hàng và PIN để đăng nhập lại.',
    confirmAction: 'Đăng xuất',
  },
  toast: {
    saved: 'Đã lưu cài đặt',
  },
};

registerDictionary('vi', 'settings', settingsVi);
