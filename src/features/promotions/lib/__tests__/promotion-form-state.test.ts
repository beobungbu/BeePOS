import type { Promotion } from '../../../../domain/types';
import {
  emptyPromotionForm,
  formToPromotion,
  formatFormDate,
  parseFormDate,
  promotionToForm,
  validatePromotionForm,
} from '../promotion-form-state';
import {
  matchesQuery,
  promotionScope,
  promotionStatus,
  promotionStores,
  sortPromotions,
} from '../promotion-status';

const NOW = new Date('2026-09-11T09:00:00.000Z');
const ORG = 'org-1';

const MESSAGES = {
  required: 'required',
  positive: 'positive',
  scope: 'scope',
  window: 'window',
};

function makePromotion(overrides: Partial<Promotion>): Promotion {
  return {
    id: 'promo-1',
    orgId: ORG,
    name: 'KM Tết',
    type: 'percent',
    value: 10,
    startsAt: new Date('2026-09-01T00:00:00.000Z'),
    endsAt: new Date('2026-09-30T23:59:59.999Z'),
    isActive: true,
    stackable: true,
    ...overrides,
  };
}

describe('promotionStatus', () => {
  it('is active inside the window when switched on', () => {
    expect(promotionStatus(makePromotion({}), NOW)).toBe('active');
  });

  it('is scheduled before the window opens', () => {
    const promotion = makePromotion({ startsAt: new Date('2026-09-20T00:00:00.000Z') });
    expect(promotionStatus(promotion, NOW)).toBe('scheduled');
  });

  it('is expired after the window closes, whatever the switch says', () => {
    const promotion = makePromotion({
      startsAt: new Date('2026-08-01T00:00:00.000Z'),
      endsAt: new Date('2026-08-15T00:00:00.000Z'),
      isActive: true,
    });
    expect(promotionStatus(promotion, NOW)).toBe('expired');
  });

  it('is paused when switched off inside its window', () => {
    expect(promotionStatus(makePromotion({ isActive: false }), NOW)).toBe('paused');
  });
});

describe('promotion scope readers', () => {
  it('reads products, categories or the whole catalogue', () => {
    expect(promotionScope(makePromotion({ productIds: ['p1'] }))).toBe('products');
    expect(promotionScope(makePromotion({ categoryIds: ['c1'] }))).toBe('categories');
    expect(promotionScope(makePromotion({ productIds: [] }))).toBe('all');
  });

  it('reads an empty store list as every branch', () => {
    expect(promotionStores(makePromotion({ storeIds: [] }))).toBeNull();
    expect(promotionStores(makePromotion({ storeIds: ['store-1'] }))).toEqual(['store-1']);
  });
});

describe('sortPromotions', () => {
  it('puts running first and ended last', () => {
    const rows = sortPromotions(
      [
        makePromotion({ id: 'ended', endsAt: new Date('2026-08-01T00:00:00.000Z') }),
        makePromotion({ id: 'paused', isActive: false }),
        makePromotion({ id: 'running' }),
      ],
      NOW,
    );
    expect(rows.map((row) => row.id)).toEqual(['running', 'paused', 'ended']);
  });
});

describe('matchesQuery', () => {
  it('matches on name and lets an empty query through', () => {
    const promotion = makePromotion({ name: 'KM Tết sữa' });
    expect(matchesQuery(promotion, '')).toBe(true);
    expect(matchesQuery(promotion, 'sữa')).toBe(true);
    expect(matchesQuery(promotion, 'mì')).toBe(false);
  });
});

describe('form dates', () => {
  it('round trips a day', () => {
    expect(formatFormDate(parseFormDate('30/09/2026') as Date)).toBe('30/09/2026');
  });

  it('refuses a day that does not exist', () => {
    expect(parseFormDate('31/02/2026')).toBeNull();
    expect(parseFormDate('2026-09-30')).toBeNull();
  });
});

describe('validatePromotionForm', () => {
  it('accepts the default new form once it is named', () => {
    const values = { ...emptyPromotionForm(NOW), name: 'KM mới' };
    expect(validatePromotionForm(values, MESSAGES)).toEqual({});
  });

  it('needs a name, a positive value and a window in the right order', () => {
    const values = {
      ...emptyPromotionForm(NOW),
      name: '  ',
      value: '0',
      startsAt: '30/09/2026',
      endsAt: '01/09/2026',
    };
    expect(validatePromotionForm(values, MESSAGES)).toEqual({
      name: 'required',
      value: 'positive',
      window: 'window',
    });
  });

  it('needs something picked once the scope is narrowed', () => {
    const values = { ...emptyPromotionForm(NOW), name: 'KM', scope: 'products' as const };
    expect(validatePromotionForm(values, MESSAGES).scope).toBe('scope');
  });

  it('checks the quantities instead of the value for buy X get Y', () => {
    const values = {
      ...emptyPromotionForm(NOW),
      name: 'KM',
      type: 'buy_x_get_y' as const,
      value: '0',
      getQty: '0',
    };
    const errors = validatePromotionForm(values, MESSAGES);
    expect(errors.value).toBeUndefined();
    expect(errors.buyQty).toBe('positive');
  });
});

describe('formToPromotion', () => {
  it('runs the window to the end of its last day', () => {
    const values = {
      ...emptyPromotionForm(NOW),
      name: 'KM Tết',
      startsAt: '01/09/2026',
      endsAt: '30/09/2026',
    };
    const promotion = formToPromotion(values, { id: 'promo-9', orgId: ORG });
    expect(promotion.startsAt.toISOString()).toBe('2026-09-01T00:00:00.000Z');
    expect(promotion.endsAt.toISOString()).toBe('2026-09-30T23:59:59.999Z');
    expect(promotionStatus(promotion, new Date('2026-09-30T22:00:00.000Z'))).toBe('active');
  });

  it('drops the scope lists the chosen scope does not use', () => {
    const values = {
      ...emptyPromotionForm(NOW),
      name: 'KM',
      scope: 'categories' as const,
      productIds: ['p1'],
      categoryIds: ['c1'],
    };
    const promotion = formToPromotion(values, { id: 'promo-9', orgId: ORG });
    expect(promotion.productIds).toBeUndefined();
    expect(promotion.categoryIds).toEqual(['c1']);
  });

  it('keeps only the quantities buy X get Y needs', () => {
    const values = { ...emptyPromotionForm(NOW), name: 'KM', type: 'buy_x_get_y' as const };
    const promotion = formToPromotion(values, { id: 'promo-9', orgId: ORG });
    expect(promotion.value).toBe(0);
    expect(promotion.buyQty).toBe(2);
    expect(promotion.getQty).toBe(1);
  });

  it('round trips an existing record through the form', () => {
    const original = makePromotion({ productIds: ['p1', 'p2'], storeIds: ['store-1'], value: 15 });
    const round = formToPromotion(promotionToForm(original), { id: original.id, orgId: ORG });
    expect(round).toMatchObject({
      id: original.id,
      name: original.name,
      value: 15,
      productIds: ['p1', 'p2'],
      storeIds: ['store-1'],
      stackable: true,
    });
  });
});
