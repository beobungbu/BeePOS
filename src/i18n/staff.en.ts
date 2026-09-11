import { registerDictionary } from './registry';

export const staffEn = {
  title: 'Staff',
  validation: {
    required: 'Required',
    pinMismatch: 'The two PINs do not match',
    pinInvalid: 'PIN must be exactly 4 digits',
  },
  addStaff: 'Add staff',
  editStaff: 'Edit staff',
  field: {
    name: 'Full name',
    phone: 'Phone number',
    role: 'Role',
    stores: 'Assigned stores',
    active: 'Currently active',
  },
  role: {
    owner: 'Owner',
    manager: 'Manager',
    cashier: 'Cashier',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
  },
  list: {
    empty: 'No staff yet',
  },
  detail: {
    info: 'Staff information',
    save: 'Save changes',
  },
  resetPin: {
    action: 'Reset PIN',
    title: 'Reset PIN',
    description: 'Enter a new 4-digit PIN for this staff member',
    newPin: 'New PIN',
    confirmPin: 'Confirm new PIN',
    confirm: 'Confirm reset',
    successToast: 'PIN reset successfully',
  },
  toast: {
    saved: 'Staff information saved',
    created: 'New staff member added',
  },
};

registerDictionary('en', 'staff', staffEn);
