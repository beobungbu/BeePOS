import { draftPayment } from '../payment-draft';

describe('draftPayment', () => {
  it('records nothing while the amount field is empty', () => {
    const draft = draftPayment({ method: 'cash', remaining: 81_500, amountText: '' });
    expect(draft.payment).toBeUndefined();
    expect(draft.settlesBalance).toBe(false);
  });

  it('caps a cash payment at the balance and returns the change', () => {
    const draft = draftPayment({ method: 'cash', remaining: 81_500, amountText: '100000' });
    expect(draft.payment).toEqual({ method: 'cash', amount: 81_500, ref: 'tendered=100000' });
    expect(draft.change).toBe(18_500);
    expect(draft.settlesBalance).toBe(true);
  });

  it('treats a short cash amount as a partial payment with no change', () => {
    const draft = draftPayment({ method: 'cash', remaining: 81_500, amountText: '50000' });
    expect(draft.payment).toEqual({ method: 'cash', amount: 50_000, ref: 'tendered=50000' });
    expect(draft.change).toBe(0);
    expect(draft.settlesBalance).toBe(false);
  });

  it('keeps a card reference and drops an empty one', () => {
    expect(draftPayment({ method: 'card', remaining: 50_000, amountText: '50000', refText: ' 4321 ' }).payment)
      .toEqual({ method: 'card', amount: 50_000, ref: '4321' });
    expect(draftPayment({ method: 'card', remaining: 50_000, amountText: '50000', refText: '  ' }).payment)
      .toEqual({ method: 'card', amount: 50_000, ref: undefined });
  });

  it('never lets a transfer overpay the balance', () => {
    const draft = draftPayment({ method: 'transfer', remaining: 31_500, amountText: '40000' });
    expect(draft.payment?.amount).toBe(31_500);
    expect(draft.settlesBalance).toBe(true);
  });

  it('clamps redeemed points to the balance the customer holds', () => {
    const draft = draftPayment({
      method: 'points',
      remaining: 81_500,
      amountText: '',
      pointsText: '500',
      customerPoints: 120,
    });
    // 120 points redeem for 120.000 đ, more than the order needs, so the payment is the balance.
    expect(draft.payment).toEqual({ method: 'points', amount: 81_500, ref: 'points=120' });
    expect(draft.exceedsPoints).toBe(true);
  });

  it('records no points payment without an attached customer', () => {
    const draft = draftPayment({ method: 'points', remaining: 81_500, amountText: '', pointsText: '10' });
    expect(draft.payment).toBeUndefined();
    expect(draft.exceedsPoints).toBe(true);
  });

  it('reports a settled balance when nothing is left to pay', () => {
    expect(draftPayment({ method: 'cash', remaining: 0, amountText: '' }).settlesBalance).toBe(true);
  });

  it('ignores a negative or unparseable amount', () => {
    expect(draftPayment({ method: 'cash', remaining: 10_000, amountText: '-5000' }).payment).toBeUndefined();
    expect(draftPayment({ method: 'cash', remaining: 10_000, amountText: 'abc' }).payment).toBeUndefined();
  });
});
