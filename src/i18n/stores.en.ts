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
  toast: {
    saved: 'Store information saved',
    created: 'New store created',
    statusChanged: 'Store status updated',
  },
};

registerDictionary('en', 'stores', storesEn);
