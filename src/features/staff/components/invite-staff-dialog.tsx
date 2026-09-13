import { useState } from 'react';
import {
  Button,
  ButtonLabel,
  Checkbox,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  Field,
  FormGroup,
  Input,
  Radio,
  RadioGroup,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { useT } from '../../../i18n';
import { isValidEmail } from '../../../domain/auth';
import { canAssignRole } from '../../../domain/org';
import type { Staff, StaffRole, Store } from '../../../domain/types';

export interface StaffInvite {
  email: string;
  name: string;
  role: StaffRole;
  storeIds: string[];
}

const ROLES: StaffRole[] = ['owner', 'manager', 'cashier'];

/**
 * Invite by email. The member is created straight away in the `invited` state with a temporary
 * password, rather than after the invite is accepted: the roster, the PIN and the shift have to
 * exist the moment the shop puts someone on a till, and the account state is what says whether
 * they have signed in yet.
 */
export function InviteStaffDialog({
  open,
  onOpenChange,
  stores,
  actorRole,
  existingEmails,
  defaultStoreId,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stores: Store[];
  actorRole: Staff['role'];
  existingEmails: string[];
  defaultStoreId?: string;
  onInvite: (invite: StaffInvite) => void;
}) {
  const t = useT();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<StaffRole>('cashier');
  const [storeIds, setStoreIds] = useState<string[]>(defaultStoreId ? [defaultStoreId] : []);
  const [touched, setTouched] = useState(false);

  const taken = existingEmails.some((item) => item.toLowerCase() === email.trim().toLowerCase());
  const emailError = !isValidEmail(email)
    ? t('staff.invite.emailInvalid')
    : taken
      ? t('staff.invite.emailTaken')
      : undefined;
  const nameError = name.trim().length === 0 ? t('staff.validation.required') : undefined;
  const storeError = storeIds.length === 0 ? t('staff.validation.required') : undefined;

  function reset() {
    setEmail('');
    setName('');
    setRole('cashier');
    setStoreIds(defaultStoreId ? [defaultStoreId] : []);
    setTouched(false);
  }

  function handleSubmit() {
    setTouched(true);
    if (emailError || nameError || storeError) return;
    onInvite({ email: email.trim().toLowerCase(), name: name.trim(), role, storeIds });
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogTitle>{t('staff.invite.title')}</DialogTitle>
        <VStack gap="md">
          <Text variant="caption" className="text-muted-foreground">
            {t('staff.invite.description')}
          </Text>

          <Field
            label={t('staff.invite.email')}
            error={touched ? emailError : undefined}
            invalid={touched && Boolean(emailError)}
            required
          >
            <Input
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder={t('staff.invite.emailPlaceholder')}
              accessibilityLabel={t('staff.invite.email')}
            />
          </Field>

          <Field
            label={t('staff.invite.name')}
            error={touched ? nameError : undefined}
            invalid={touched && Boolean(nameError)}
            required
          >
            <Input value={name} onChangeText={setName} accessibilityLabel={t('staff.invite.name')} />
          </Field>

          {/* Only roles this member may hand out: a manager can staff their branch with
              cashiers, never with another manager. */}
          <FormGroup legend={t('staff.invite.role')}>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as StaffRole)}>
              {ROLES.filter((candidate) => canAssignRole(actorRole, candidate)).map((candidate) => (
                <Radio key={candidate} value={candidate} label={t(`staff.role.${candidate}`)} />
              ))}
            </RadioGroup>
          </FormGroup>

          <FormGroup
            legend={t('staff.invite.stores')}
            error={touched ? storeError : undefined}
            invalid={touched && Boolean(storeError)}
            required
          >
            <VStack gap="xs">
              {stores.map((store) => (
                <Checkbox
                  key={store.id}
                  label={store.name}
                  checked={storeIds.includes(store.id)}
                  onCheckedChange={(checked) =>
                    setStoreIds((prev) =>
                      checked ? [...prev, store.id] : prev.filter((id) => id !== store.id),
                    )
                  }
                />
              ))}
            </VStack>
          </FormGroup>

          <Text variant="caption" className="text-subtle-foreground">
            {t('staff.invite.mockNote')}
          </Text>
        </VStack>

        <DialogFooter>
          <Button variant="secondary" onPress={() => onOpenChange(false)}>
            <ButtonLabel>{t('common.actions.cancel')}</ButtonLabel>
          </Button>
          <Button onPress={handleSubmit}>
            <ButtonLabel>{t('staff.invite.submit')}</ButtonLabel>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
