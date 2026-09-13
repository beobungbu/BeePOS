import type { Organization } from '../../domain/types';

/**
 * The one chain the prototype ships with. Every seeded root entity carries this id, and the
 * persistence keys are namespaced by it, so a second chain created through onboarding starts
 * from empty storage instead of inheriting this one's catalogue.
 */
export const DEMO_ORG_ID = 'org-1';

/** Email domain of the seeded accounts; the README documents the demo credentials. */
export const DEMO_EMAIL_DOMAIN = 'chuoi.vn';

export const organization: Organization = {
  id: DEMO_ORG_ID,
  code: 'chuoi-tap-hoa',
  name: 'Chuỗi tạp hoá Bee',
  plan: 'pro',
  currency: 'VND',
  // Ten digits, the shape of a Vietnamese chain MST. Printed as the seller tax code on the
  // VAT invoice, which is otherwise a tax document with a blank seller line.
  taxCode: '0108452317',
  taxRate: 0.08,
  receiptHeader: 'BeePOS',
  receiptFooter: 'Cảm ơn quý khách, hẹn gặp lại',
  createdAt: new Date('2026-01-05T00:00:00.000Z'),
};
