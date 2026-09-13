import { View } from 'react-native';
import {
  Field,
  Input,
  SegmentedControl,
  SegmentedControlItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
} from '@beemvp/beeui-ui';
import { selectContentHeight } from '../../../components/select-content-height';
import type { Customer, CustomerGroup, CustomerType, Staff } from '../../../domain/types';
import { useT } from '../../../i18n';
import { fill } from '../../orders/lib/fill';

/** The company half of the customer form, as text the caller keeps in state. */
export interface CustomerBusinessDraft {
  type: CustomerType;
  companyName: string;
  taxCode: string;
  contactName: string;
  billingAddress: string;
  deliveryAddress: string;
  groupId: string;
  salesRepId: string;
  /** Raw text; a non-numeric entry reads as no limit, which is "no credit". */
  creditLimit: string;
  paymentTermDays: string;
}

export const NONE = 'none';

export const EMPTY_BUSINESS_DRAFT: CustomerBusinessDraft = {
  type: 'retail',
  companyName: '',
  taxCode: '',
  contactName: '',
  billingAddress: '',
  deliveryAddress: '',
  groupId: NONE,
  salesRepId: NONE,
  creditLimit: '',
  paymentTermDays: '',
};

/** The saved shape of the draft, ready to be merged onto a `Customer`. */
export function businessPatchOf(draft: CustomerBusinessDraft): Partial<Customer> {
  if (draft.type === 'retail') {
    // Clearing the company fields matters: a buyer moved back to retail must stop offering
    // "Ghi nợ" at the till, and a stale credit limit would keep offering it.
    return {
      type: 'retail',
      companyName: undefined,
      taxCode: undefined,
      contactName: undefined,
      deliveryAddress: undefined,
      salesRepId: undefined,
      creditLimit: undefined,
      paymentTermDays: undefined,
      groupId: draft.groupId === NONE ? undefined : draft.groupId,
    };
  }
  const creditLimit = Number.parseFloat(draft.creditLimit);
  const paymentTermDays = Number.parseInt(draft.paymentTermDays, 10);
  return {
    type: 'company',
    companyName: draft.companyName.trim() || undefined,
    taxCode: draft.taxCode.trim() || undefined,
    contactName: draft.contactName.trim() || undefined,
    deliveryAddress: draft.deliveryAddress.trim() || undefined,
    groupId: draft.groupId === NONE ? undefined : draft.groupId,
    salesRepId: draft.salesRepId === NONE ? undefined : draft.salesRepId,
    creditLimit: Number.isFinite(creditLimit) && creditLimit > 0 ? creditLimit : 0,
    paymentTermDays: Number.isFinite(paymentTermDays) && paymentTermDays > 0 ? paymentTermDays : 0,
  };
}

/** Reads a stored customer (and its billing address) back into an editable draft. */
export function businessDraftOf(
  customer: Customer | undefined,
  billingAddress: string | undefined,
): CustomerBusinessDraft {
  if (!customer) return EMPTY_BUSINESS_DRAFT;
  return {
    type: customer.type,
    companyName: customer.companyName ?? '',
    taxCode: customer.taxCode ?? '',
    contactName: customer.contactName ?? '',
    billingAddress: billingAddress ?? '',
    deliveryAddress: customer.deliveryAddress ?? '',
    groupId: customer.groupId ?? NONE,
    salesRepId: customer.salesRepId ?? NONE,
    creditLimit: customer.creditLimit ? String(customer.creditLimit) : '',
    paymentTermDays: customer.paymentTermDays ? String(customer.paymentTermDays) : '',
  };
}

interface CustomerBusinessFieldsProps {
  value: CustomerBusinessDraft;
  onChange: (next: CustomerBusinessDraft) => void;
  groups: CustomerGroup[];
  reps: Staff[];
}

/**
 * One form with two shapes (`docs/design/specs/commerce.md` section B): the segmented control
 * picks `Khách lẻ` or `Công ty`, and only the company choice reveals the tax code, the
 * addresses, the group, the rep, the credit limit and the payment term. Picking retail hides
 * them rather than opening a second screen, because they are the same customer either way.
 *
 * Every field states its consequence directly under itself: a limit of 0 locks `Ghi nợ` at
 * the till, and the delivery address is what a delivery note defaults to.
 */
export function CustomerBusinessFields({
  value,
  onChange,
  groups,
  reps,
}: CustomerBusinessFieldsProps) {
  const t = useT();
  const patch = (next: Partial<CustomerBusinessDraft>) => onChange({ ...value, ...next });

  return (
    <View className="gap-4">
      <Field label={t('customers.business.type')}>
        <SegmentedControl
          value={value.type}
          onValueChange={(next) => patch({ type: next as CustomerType })}
        >
          <SegmentedControlItem value="retail">{t('customers.business.typeRetail')}</SegmentedControlItem>
          <SegmentedControlItem value="company">{t('customers.business.typeCompany')}</SegmentedControlItem>
        </SegmentedControl>
      </Field>
      <Text variant="caption" className="text-subtle-foreground">
        {t('customers.business.typeHint')}
      </Text>

      {value.type === 'company' ? (
        <>
          <Field label={t('customers.business.companyName')}>
            <Input value={value.companyName} onChangeText={(companyName) => patch({ companyName })} />
          </Field>
          <Field label={t('customers.business.taxCode')}>
            <Input
              value={value.taxCode}
              onChangeText={(taxCode) => patch({ taxCode })}
              keyboardType="numeric"
            />
          </Field>
          <Field label={t('customers.business.contactName')}>
            <Input value={value.contactName} onChangeText={(contactName) => patch({ contactName })} />
          </Field>
          <Field label={t('customers.business.billingAddress')}>
            <Input
              value={value.billingAddress}
              onChangeText={(billingAddress) => patch({ billingAddress })}
            />
          </Field>
          <Field
            label={t('customers.business.deliveryAddress')}
            description={t('customers.business.deliveryHint')}
          >
            <Input
              value={value.deliveryAddress}
              onChangeText={(deliveryAddress) => patch({ deliveryAddress })}
            />
          </Field>
        </>
      ) : null}

      <Field label={t('customers.business.group')} description={t('customers.business.groupHint')}>
        <Select value={value.groupId} onValueChange={(groupId) => patch({ groupId })}>
          <SelectTrigger accessibilityLabel={t('customers.business.group')}>
            <SelectValue placeholder={t('customers.business.groupNone')} />
          </SelectTrigger>
          <SelectContent maxHeight={selectContentHeight(groups.length + 1)}>
            <SelectItem value={NONE}>{t('customers.business.groupNone')}</SelectItem>
            {groups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.discountPercent > 0
                  ? `${group.name} · ${fill(t('customers.business.discountPercent'), {
                      percent: group.discountPercent,
                    })}`
                  : group.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {value.type === 'company' ? (
        <>
          <Field label={t('customers.business.salesRep')}>
            <Select value={value.salesRepId} onValueChange={(salesRepId) => patch({ salesRepId })}>
              <SelectTrigger accessibilityLabel={t('customers.business.salesRep')}>
                <SelectValue placeholder={t('customers.business.salesRepNone')} />
              </SelectTrigger>
              <SelectContent maxHeight={selectContentHeight(reps.length + 1)}>
                <SelectItem value={NONE}>{t('customers.business.salesRepNone')}</SelectItem>
                {reps.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <View className="flex-row flex-wrap gap-3">
            <Field className="min-w-40 flex-1" label={t('customers.business.creditLimit')}>
              <Input
                value={value.creditLimit}
                onChangeText={(creditLimit) => patch({ creditLimit })}
                keyboardType="numeric"
                className="text-right tabular-nums"
              />
            </Field>
            <Field className="min-w-32 flex-1" label={t('customers.business.paymentTerm')}>
              <Input
                value={value.paymentTermDays}
                onChangeText={(paymentTermDays) => patch({ paymentTermDays })}
                keyboardType="numeric"
                className="text-right tabular-nums"
              />
            </Field>
          </View>
          <Text variant="caption" className="text-muted-foreground">
            {t('customers.business.creditHint')}
          </Text>
        </>
      ) : null}
    </View>
  );
}
