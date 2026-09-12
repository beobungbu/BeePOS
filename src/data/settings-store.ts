import { create } from 'zustand';
import { readBooleanPreference, writeBooleanPreference } from '../lib/preference-storage';

/** Storage key for the desktop sidebar/rail preference. */
export const SIDEBAR_COLLAPSED_KEY = 'beepos.sidebar-collapsed';

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
  /** Desktop only: the shell shows the 72 pt rail instead of the 240 pt sidebar. */
  sidebarCollapsed: boolean;
  /**
   * Same thing for `/pos*`, which opens in rail mode whatever the preference says and is
   * deliberately not persisted: leaving the sell screen restores the saved preference.
   */
  posSidebarCollapsed: boolean;
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
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPosSidebarCollapsed: (collapsed: boolean) => void;
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
  sidebarCollapsed: readBooleanPreference(SIDEBAR_COLLAPSED_KEY, false),
  posSidebarCollapsed: true,

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

  setSidebarCollapsed: (sidebarCollapsed) => {
    writeBooleanPreference(SIDEBAR_COLLAPSED_KEY, sidebarCollapsed);
    set({ sidebarCollapsed });
  },
  setPosSidebarCollapsed: (posSidebarCollapsed) => set({ posSidebarCollapsed }),
}));
