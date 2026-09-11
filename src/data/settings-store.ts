import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Locale = 'vi' | 'en';
export type Density = 'comfortable' | 'compact';

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface SettingsState {
  theme: ThemeMode;
  locale: Locale;
  density: Density;
  defaultStoreId: string | null;
  defaultTaxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  receiptShowLogo: boolean;
  currencyDisplay: 'symbol' | 'code';
  bankInfo: BankInfo;
  printerId: string | null;
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  setDefaultStoreId: (storeId: string | null) => void;
  setDefaultTaxRate: (rate: number) => void;
  setReceiptHeader: (text: string) => void;
  setReceiptFooter: (text: string) => void;
  setReceiptShowLogo: (show: boolean) => void;
  setCurrencyDisplay: (mode: 'symbol' | 'code') => void;
  setBankInfo: (info: BankInfo) => void;
  setPrinterId: (printerId: string | null) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  locale: 'vi',
  density: 'comfortable',
  defaultStoreId: null,
  defaultTaxRate: 0.08,
  receiptHeader: 'BeePOS',
  receiptFooter: 'Cảm ơn quý khách, hẹn gặp lại',
  receiptShowLogo: true,
  currencyDisplay: 'symbol',
  bankInfo: { bankName: '', accountNumber: '', accountHolder: '' },
  printerId: null,

  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setDensity: (density) => set({ density }),
  setDefaultStoreId: (defaultStoreId) => set({ defaultStoreId }),
  setDefaultTaxRate: (defaultTaxRate) => set({ defaultTaxRate }),
  setReceiptHeader: (receiptHeader) => set({ receiptHeader }),
  setReceiptFooter: (receiptFooter) => set({ receiptFooter }),
  setReceiptShowLogo: (receiptShowLogo) => set({ receiptShowLogo }),
  setCurrencyDisplay: (currencyDisplay) => set({ currencyDisplay }),
  setBankInfo: (bankInfo) => set({ bankInfo }),
  setPrinterId: (printerId) => set({ printerId }),
}));
