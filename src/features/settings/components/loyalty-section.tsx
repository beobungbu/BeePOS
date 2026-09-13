import { useState } from 'react';
import { View } from 'react-native';
import { Button, ButtonLabel, Field, HStack, Input, Section, Text, useToast, VStack } from '@beemvp/beeui-ui';
import { usePricingStore } from '../../../data/pricing-store';
import { pointsEarnedFor, tierMultiplierFor } from '../../../domain/pricing';
import { formatVND } from '../../../domain/money';
import type { CustomerTier, LoyaltyRule } from '../../../domain/types';
import { useT } from '../../../i18n';

/** The order every worked example is stated against, in dong. Big enough to earn real points. */
const EXAMPLE_ORDER = 250_000;

const TIERS: CustomerTier[] = ['bronze', 'silver', 'gold', 'platinum'];
const THRESHOLD_TIERS: Exclude<CustomerTier, 'bronze'>[] = ['silver', 'gold', 'platinum'];
/** The tier the multiplier example is written for: the first one that is not simply x 1. */
const EXAMPLE_TIER: CustomerTier = 'gold';

interface LoyaltyFormValues {
  /** "Cứ mỗi N đồng": the denominator of the earn rate, because that is how it is decided. */
  earnPerAmount: string;
  pointsPerAmount: string;
  redeemVndPerPoint: string;
  multipliers: Record<CustomerTier, string>;
  thresholds: Record<Exclude<CustomerTier, 'bronze'>, string>;
}

function toForm(rule: LoyaltyRule): LoyaltyFormValues {
  // The record stores points per dong (1/10.000); the form asks the question the other way
  // round, which is the way a shop owner states it.
  const perAmount = rule.earnPerVnd > 0 ? Math.round(1 / rule.earnPerVnd) : 10_000;
  return {
    earnPerAmount: String(perAmount),
    pointsPerAmount: '1',
    redeemVndPerPoint: String(rule.redeemVndPerPoint),
    multipliers: {
      bronze: String(tierMultiplierFor(rule, 'bronze')),
      silver: String(tierMultiplierFor(rule, 'silver')),
      gold: String(tierMultiplierFor(rule, 'gold')),
      platinum: String(tierMultiplierFor(rule, 'platinum')),
    },
    thresholds: {
      silver: String(rule.tierThresholds.silver),
      gold: String(rule.tierThresholds.gold),
      platinum: String(rule.tierThresholds.platinum),
    },
  };
}

function numberOr(value: string, fallback: number): number {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/**
 * The chain's loyalty maths, in four blocks: earn, redeem, the per tier multiplier and the
 * tier thresholds. They are four separate decisions and the mockup keeps them apart on
 * purpose; every numeric field carries a worked example in real money, because an earn rate is
 * abstract until it is one concrete order (`docs/design/specs/commerce.md` section B).
 */
export function LoyaltySection() {
  const t = useT();
  const toast = useToast();
  const rule = usePricingStore((state) => state.loyaltyRule);
  const setLoyaltyRule = usePricingStore((state) => state.setLoyaltyRule);
  const [values, setValues] = useState<LoyaltyFormValues>(() => toForm(rule));

  const earnPerAmount = numberOr(values.earnPerAmount, 10_000);
  const pointsPerAmount = numberOr(values.pointsPerAmount, 1);
  const earnPerVnd = pointsPerAmount / earnPerAmount;
  const redeemVndPerPoint = numberOr(values.redeemVndPerPoint, 1_000);

  const basePoints = pointsEarnedFor(EXAMPLE_ORDER, earnPerVnd);
  const exampleMultiplier = numberOr(values.multipliers[EXAMPLE_TIER], 1);
  const tierPoints = pointsEarnedFor(EXAMPLE_ORDER, earnPerVnd, exampleMultiplier);
  const redeemValue = basePoints * redeemVndPerPoint;
  const redeemPercent = Math.round((redeemValue / EXAMPLE_ORDER) * 100);

  function setField<K extends keyof LoyaltyFormValues>(key: K, value: LoyaltyFormValues[K]) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  function handleSave() {
    setLoyaltyRule({
      ...rule,
      earnPerVnd,
      redeemVndPerPoint,
      tierThresholds: {
        silver: numberOr(values.thresholds.silver, rule.tierThresholds.silver),
        gold: numberOr(values.thresholds.gold, rule.tierThresholds.gold),
        platinum: numberOr(values.thresholds.platinum, rule.tierThresholds.platinum),
      },
      tierMultiplier: {
        bronze: numberOr(values.multipliers.bronze, 1),
        silver: numberOr(values.multipliers.silver, 1),
        gold: numberOr(values.multipliers.gold, 1),
        platinum: numberOr(values.multipliers.platinum, 1),
      },
    });
    toast.show({ title: t('settings.loyalty.saved'), variant: 'success' });
  }

  return (
    <Section title={t('settings.section.loyalty')}>
      <VStack gap="lg">
        <Text variant="caption" tone="muted">
          {t('settings.loyalty.scope')}
        </Text>

        <VStack gap="sm">
          <Text variant="label" className="font-semibold text-foreground">
            {t('settings.loyalty.earnTitle')}
          </Text>
          <HStack gap="md" wrap align="start">
            <Field label={t('settings.loyalty.earnPer')} className="min-w-36 flex-1">
              <Input
                value={values.earnPerAmount}
                onChangeText={(text) => setField('earnPerAmount', text)}
                keyboardType="number-pad"
              />
            </Field>
            <Field label={t('settings.loyalty.earnPoints')} className="min-w-28 flex-1">
              <Input
                value={values.pointsPerAmount}
                onChangeText={(text) => setField('pointsPerAmount', text)}
                keyboardType="number-pad"
              />
            </Field>
          </HStack>
          <Text variant="caption" tone="muted">
            {t('settings.loyalty.earnExample')
              .replace('{amount}', formatVND(EXAMPLE_ORDER))
              .replace('{points}', String(basePoints))}
          </Text>
        </VStack>

        <VStack gap="sm">
          <Text variant="label" className="font-semibold text-foreground">
            {t('settings.loyalty.redeemTitle')}
          </Text>
          <Field label={t('settings.loyalty.redeemRate')}>
            <Input
              value={values.redeemVndPerPoint}
              onChangeText={(text) => setField('redeemVndPerPoint', text)}
              keyboardType="number-pad"
            />
          </Field>
          <Text variant="caption" tone="muted">
            {t('settings.loyalty.redeemExample')
              .replace('{points}', String(basePoints))
              .replace('{amount}', formatVND(redeemValue))
              .replace('{percent}', String(redeemPercent))}
          </Text>
        </VStack>

        <VStack gap="sm">
          <Text variant="label" className="font-semibold text-foreground">
            {t('settings.loyalty.tierTitle')}
          </Text>
          {TIERS.map((tier) => (
            <View className="min-h-11 flex-row items-center gap-3" key={tier}>
              <Text variant="label" className="w-24 text-foreground">
                {t(`settings.loyalty.tier.${tier}`)}
              </Text>
              <View className="min-w-0 flex-1">
                <Input
                  accessibilityLabel={`${t('settings.loyalty.tierTitle')} · ${t(`settings.loyalty.tier.${tier}`)}`}
                  value={values.multipliers[tier]}
                  onChangeText={(text) =>
                    setField('multipliers', { ...values.multipliers, [tier]: text })
                  }
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          ))}
          <Text variant="caption" tone="muted">
            {t('settings.loyalty.tierExample')
              .replace('{amount}', formatVND(EXAMPLE_ORDER))
              .replace('{tier}', t(`settings.loyalty.tier.${EXAMPLE_TIER}`))
              .replace('{base}', String(basePoints))
              // Written the Vietnamese way in the sentence; the field itself stays as typed.
              .replace('{multiplier}', values.multipliers[EXAMPLE_TIER].replace('.', ','))
              .replace('{points}', String(tierPoints))}
          </Text>
          <Text variant="caption" tone="muted">
            {t('settings.loyalty.tierHint')}
          </Text>
        </VStack>

        <VStack gap="sm">
          <Text variant="label" className="font-semibold text-foreground">
            {t('settings.loyalty.thresholdTitle')}
          </Text>
          {THRESHOLD_TIERS.map((tier) => (
            <View className="min-h-11 flex-row items-center gap-3" key={tier}>
              <Text variant="label" className="w-24 text-foreground">
                {t(`settings.loyalty.tier.${tier}`)}
              </Text>
              <View className="min-w-0 flex-1">
                <Input
                  accessibilityLabel={`${t('settings.loyalty.thresholdTitle')} · ${t(`settings.loyalty.tier.${tier}`)}`}
                  value={values.thresholds[tier]}
                  onChangeText={(text) =>
                    setField('thresholds', { ...values.thresholds, [tier]: text })
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>
          ))}
        </VStack>

        <Button onPress={handleSave} accessibilityLabel={t('settings.loyalty.save')}>
          <ButtonLabel>{t('settings.loyalty.save')}</ButtonLabel>
        </Button>
      </VStack>
    </Section>
  );
}
