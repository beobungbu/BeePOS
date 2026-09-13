/**
 * The editing half of the promotions screen, shared by the desktop pane and the phone route so
 * both save through one path.
 */

import { useMemo } from 'react';
import { useToast } from '@beemvp/beeui-ui';
import { usePricingStore } from '../../data/pricing-store';
import { currentOrgId } from '../../data/org-store';
import { useT } from '../../i18n';
import type { Promotion } from '../../domain/types';
import {
  emptyPromotionForm,
  formToPromotion,
  promotionToForm,
  usePromotionForm,
} from './lib/promotion-form-state';

/** The id a new programme is edited under, in the pane and in the route alike. */
export const NEW_PROMOTION_ID = 'new';

function makePromotionId(): string {
  return `promo-${Date.now().toString(36)}-${Math.floor(Math.random() * 1_000).toString(36)}`;
}

export function usePromotionEditor(promotionId: string, now: Date) {
  const t = useT();
  const toast = useToast();
  const promotions = usePricingStore((state) => state.promotions);
  const upsertPromotion = usePricingStore((state) => state.upsertPromotion);
  const setPromotionActive = usePricingStore((state) => state.setPromotionActive);

  const promotion = promotions.find((entry) => entry.id === promotionId);
  const initial = useMemo(
    () => (promotion ? promotionToForm(promotion) : emptyPromotionForm(now)),
    // The form is re-seeded when the selected id changes, not when the record is edited under
    // it: otherwise saving would snap the fields back mid-typing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promotionId],
  );
  const form = usePromotionForm(initial, promotionId);

  function save(): Promotion | null {
    const ok = form.validate({
      required: t('promotions.validation.required'),
      positive: t('promotions.validation.positive'),
      scope: t('promotions.validation.scope'),
      window: t('promotions.validation.window'),
    });
    if (!ok) return null;

    const saved = formToPromotion(form.values, {
      id: promotion?.id ?? makePromotionId(),
      orgId: promotion?.orgId ?? currentOrgId(),
    });
    upsertPromotion(saved);
    toast.show({ title: t('promotions.toast.saved'), variant: 'success' });
    return saved;
  }

  function setActive(isActive: boolean) {
    if (!promotion) return;
    setPromotionActive(promotion.id, isActive);
    form.setField('isActive', isActive);
    toast.show({
      title: isActive ? t('promotions.toast.resumed') : t('promotions.toast.paused'),
      variant: 'info',
    });
  }

  return { promotion, form, save, setActive, isNew: promotion === undefined };
}
