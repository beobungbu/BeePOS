import { registerDictionary } from './registry';

export const commonEn = {
  nav: {
    pos: 'Sell',
    orders: 'Orders',
    products: 'Products',
    inventory: 'Inventory',
    customers: 'Customers',
    reports: 'Reports',
    stores: 'Stores',
    staff: 'Staff',
    settings: 'Settings',
    more: 'More',
  },
  actions: {
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add new',
    search: 'Search',
    back: 'Back',
    next: 'Next',
    apply: 'Apply',
    close: 'Close',
  },
  auth: {
    storeCode: 'Store code',
    pin: 'PIN',
    login: 'Log in',
    logout: 'Log out',
    selectStore: 'Select store',
    invalidCredentials: 'Store code or PIN is incorrect',
    welcome: 'Welcome to BeePOS',
    continueButton: 'Continue',
  },
  shell: {
    switchStore: 'Switch store',
    profile: 'Account',
    theme: 'Theme',
    language: 'Language',
    themeLight: 'Light',
    themeDark: 'Dark',
    themeSystem: 'System',
  },
};

registerDictionary('en', 'common', commonEn);
