import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';
export type Locale = 'vi' | 'en';
export type Density = 'comfortable' | 'compact';

interface SettingsState {
  theme: ThemeMode;
  locale: Locale;
  density: Density;
  defaultTaxRate: number;
  receiptHeader: string;
  receiptFooter: string;
  currencyDisplay: 'symbol' | 'code';
  setTheme: (theme: ThemeMode) => void;
  setLocale: (locale: Locale) => void;
  setDensity: (density: Density) => void;
  setDefaultTaxRate: (rate: number) => void;
  setReceiptHeader: (text: string) => void;
  setReceiptFooter: (text: string) => void;
  setCurrencyDisplay: (mode: 'symbol' | 'code') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: 'system',
  locale: 'vi',
  density: 'comfortable',
  defaultTaxRate: 0.08,
  receiptHeader: 'BeePOS',
  receiptFooter: 'Cảm ơn quý khách, hẹn gặp lại',
  currencyDisplay: 'symbol',

  setTheme: (theme) => set({ theme }),
  setLocale: (locale) => set({ locale }),
  setDensity: (density) => set({ density }),
  setDefaultTaxRate: (defaultTaxRate) => set({ defaultTaxRate }),
  setReceiptHeader: (receiptHeader) => set({ receiptHeader }),
  setReceiptFooter: (receiptFooter) => set({ receiptFooter }),
  setCurrencyDisplay: (currencyDisplay) => set({ currencyDisplay }),
}));
