import { registerDictionary } from './registry';

export const storesEn = {
  title: 'Stores',
  validation: {
    required: 'Required',
  },
  addStore: 'Add store',
  editStore: 'Edit store',
  field: {
    code: 'Store code',
    name: 'Store name',
    address: 'Address',
    phone: 'Phone number',
    hours: 'Opening hours',
  },
  status: {
    label: 'Status',
    active: 'Active',
    inactive: 'Inactive',
  },
  list: {
    staffCount: 'Staff',
    empty: 'No stores yet',
  },
  detail: {
    info: 'Store information',
    staffAssigned: 'Assigned staff',
    todayStats: 'Today',
    todayOrders: 'Orders',
    todayRevenue: 'Revenue',
    edit: 'Edit',
    save: 'Save changes',
    noStaff: 'No staff assigned yet',
  },
  deactivate: {
    action: 'Deactivate',
    activateAction: 'Reactivate',
    confirmTitle: 'Deactivate this store?',
    confirmDescription: 'The store will be hidden from the sales flow until reactivated.',
    confirmAction: 'Deactivate',
  },
  settings: {
    title: 'Store settings',
    hint: 'An empty field follows the chain.',
    receiptHeader: 'Receipt header',
    receiptFooter: 'Receipt footer',
    taxRate: 'Default tax rate',
    openingHours: 'Opening hours',
    printerName: 'Printer',
    inherit: 'From the chain',
    inheritValue: 'From the chain: {value}',
    overrideCount: '{count} settings differ from the chain',
    noOverride: 'Following the chain on everything',
    save: 'Save store settings',
    reset: 'Clear store settings',
    saved: 'Store settings saved',
    cleared: 'This store follows the chain again',
    taxHint: 'Enter a percentage, so 10 means ten percent.',
  },
  toast: {
    saved: 'Store information saved',
    created: 'New store created',
    statusChanged: 'Store status updated',
  },
};

registerDictionary('en', 'stores', storesEn);
