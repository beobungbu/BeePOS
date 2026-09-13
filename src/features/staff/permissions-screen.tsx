import { ScrollView, View } from 'react-native';
import { useState } from 'react';
import {
  Badge,
  ListGroup,
  ListItem,
  SafeArea,
  Screen,
  Section,
  SegmentedControl,
  SegmentedControlItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  VStack,
} from '@beemvp/beeui-ui';
import { ALL_PERMISSIONS, ROLE_DEFINITIONS, can } from '../../domain/auth';
import type { Permission, StaffRole } from '../../domain/types';
import { useBreakpoint } from '../../hooks/use-breakpoint';
import { useScreenHeader } from '../../components/shell/screen-header';
import { useT } from '../../i18n';

/** Page gutter per band: 16 phone, 20 tablet, 24 desktop (direction doc section 4). */
const GUTTER = { phone: 'p-4', tablet: 'p-5', desktop: 'p-6' } as const;

/** `pos.sell` -> `staff.permission.posSell`; dictionary keys cannot carry the dot. */
export function permissionLabelKey(permission: Permission): string {
  return `staff.permission.${permission.replace(/\.(.)/g, (_match, letter: string) => letter.toUpperCase())}`;
}

/**
 * The default role matrix, read straight off `ROLE_DEFINITIONS`. It is a screen rather than a
 * page in the docs because "who may refund" is the first question a shop asks when a cashier
 * cannot do something, and the answer has to be in the app the manager is already holding.
 *
 * Editing the matrix is not in this phase: roles are fixed, which the description says out
 * loud instead of offering controls that would not persist.
 */
export default function PermissionsScreen() {
  const t = useT();
  const breakpoint = useBreakpoint();
  useScreenHeader({ title: t('staff.permissions.title'), backTo: '/staff' });

  const roles: StaffRole[] = ROLE_DEFINITIONS.map((definition) => definition.role);
  const [role, setRole] = useState<StaffRole>('cashier');

  return (
    <Screen>
      <SafeArea className="flex-1" edges={['bottom', 'left', 'right']}>
        <ScrollView className="flex-1">
          <VStack gap="lg" className={GUTTER[breakpoint]}>
            <Text variant="caption" className="text-muted-foreground">
              {t('staff.permissions.description')}
            </Text>

            {/* A phone cannot read a 4 column matrix, and scrolling it sideways would hide the
                comparison the screen exists for. So below 768 it is one role at a time, with a
                switch per permission; from 768 up it is the matrix (direction doc section 8). */}
            {breakpoint === 'phone' ? (
              <Section title={t('staff.permissions.roleView')}>
                <SegmentedControl value={role} onValueChange={(value) => setRole(value as StaffRole)}>
                  {roles.map((item) => (
                    <SegmentedControlItem key={item} value={item}>
                      {t(`staff.role.${item}`)}
                    </SegmentedControlItem>
                  ))}
                </SegmentedControl>
                <ListGroup className="mt-3">
                  {ALL_PERMISSIONS.map((permission) => (
                    <ListItem
                      key={permission}
                      title={t(permissionLabelKey(permission))}
                      // A disabled Switch paints both states the same pale grey, so the word
                      // carries the state and the knob only reinforces it
                      // (docs/beeui-audit/findings-22-auth.md, 22-06).
                      description={
                        can(role, permission)
                          ? t('staff.permissions.allowed')
                          : t('staff.permissions.denied')
                      }
                      trailing={
                        <Switch
                          value={can(role, permission)}
                          disabled
                          accessibilityLabel={`${t(permissionLabelKey(permission))}, ${
                            can(role, permission)
                              ? t('staff.permissions.allowed')
                              : t('staff.permissions.denied')
                          }`}
                        />
                      }
                    />
                  ))}
                </ListGroup>
                <Text variant="caption" className="mt-2 text-subtle-foreground">
                  {t('staff.permissions.readOnly')}
                </Text>
              </Section>
            ) : (
            <Section title={t('staff.permissions.title')}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="min-w-[520px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('staff.permissions.permissionColumn')}</TableHead>
                        {roles.map((column) => (
                          <TableHead key={column}>{t(`staff.role.${column}`)}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ALL_PERMISSIONS.map((permission) => (
                        <TableRow key={permission}>
                          <TableCell>
                            <Text variant="label" className="font-medium text-foreground">
                              {t(permissionLabelKey(permission))}
                            </Text>
                          </TableCell>
                          {roles.map((column) => (
                            <TableCell key={column}>
                              <PermissionMark allowed={can(column, permission)} />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </View>
              </ScrollView>
              <Text variant="caption" className="mt-2 text-subtle-foreground">
                {t('staff.permissions.readOnly')}
              </Text>
            </Section>
            )}
          </VStack>
        </ScrollView>
      </SafeArea>
    </Screen>
  );
}

/**
 * A badge, not a tick glyph: colour alone would carry the whole meaning, and the word is what
 * a screen reader announces for the cell.
 */
function PermissionMark({ allowed }: { allowed: boolean }) {
  const t = useT();
  const label = allowed ? t('staff.permissions.allowed') : t('staff.permissions.denied');
  return (
    <Badge variant={allowed ? 'success' : 'outline'} accessibilityLabel={label}>
      {label}
    </Badge>
  );
}
