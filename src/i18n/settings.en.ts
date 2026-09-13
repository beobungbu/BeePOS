import { registerDictionary } from './registry';

export const settingsEn = {
  section: {
    appearance: 'Appearance',
    language: 'Language',
    defaultStore: 'Default store',
    receipt: 'Receipt',
    tax: 'Tax',
    payment: 'Payment',
    printer: 'Printer',
    about: 'About',
    security: 'Security',
    account: 'Account',
    data: 'Data',
  },
  security: {
    autoLock: 'Auto lock',
    autoLockDescription: 'Lock after a spell of no activity; a PIN reopens the till.',
    autoLockOff: 'Never lock',
    autoLockMinutes: '{count} minutes',
    changePassword: 'Change password',
  },
  density: {
    label: 'Display density',
    comfortable: 'Comfortable',
    compact: 'Compact',
  },
  defaultStore: {
    label: 'Default store when the app opens',
  },
  receipt: {
    header: 'Receipt header',
    headerPlaceholder: 'e.g. Cau Giay Grocery',
    footer: 'Receipt footer',
    footerPlaceholder: 'e.g. Thank you, see you again',
    showLogo: 'Show logo on receipt',
    preview: 'Receipt preview',
    previewSample: 'TH true MILK fresh milk x2',
    previewTotal: 'Total',
  },
  tax: {
    label: 'Default tax rate',
  },
  payment: {
    bankName: 'Bank',
    bankNamePlaceholder: 'e.g. Vietcombank',
    accountNumber: 'Account number',
    accountHolder: 'Account holder',
    vietqrNote: 'Used to generate the VietQR code for bank transfer payments',
  },
  printer: {
    label: 'Receipt printer',
    none: 'No printer selected',
    testPrint: 'Test print',
    testPrintToast: 'Test print sent',
    testPrintNoneToast: 'Select a printer before testing',
  },
  about: {
    appVersion: 'BeePOS version',
    beeuiVersion: 'BeeUI version',
    expoSdk: 'Expo SDK',
  },
  resetData: {
    action: 'Reset demo data',
    description: 'Clears the data saved on this device and loads the original demo set again.',
    confirmTitle: 'Reset the demo data?',
    confirmDescription: 'Orders, stock, customers and changed settings are deleted and cannot be restored.',
    confirmAction: 'Reset',
    successToast: 'Demo data reloaded',
    errorToast: 'The demo data could not be reset',
  },
  logout: {
    action: 'Log out',
    confirmTitle: 'Log out of BeePOS?',
    confirmDescription: 'You will need to enter the store code and PIN again to sign back in.',
    confirmAction: 'Log out',
  },
  toast: {
    saved: 'Settings saved',
  },
};

registerDictionary('en', 'settings', settingsEn);
