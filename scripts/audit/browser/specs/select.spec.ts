import { expect, test } from '@playwright/test';
import { gotoAuditHarness } from './helpers';

// SEL-01, SEL-02 (docs/beeui-audit/behavior-claims.md)

test('SEL-01: a duplicate SelectItem value disables every item sharing it and warns in development', async ({
  page,
}) => {
  // Attached before navigation: the harness renders both duplicate-value SelectItems
  // unconditionally, so BeeUI's dev-mode warning fires on initial mount, not on open.
  const warnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
  });
  await gotoAuditHarness(page);

  await page.locator('[data-testid="sel01-trigger"]').click();
  const itemA = page.locator('[data-testid="sel01-item-a"]');
  const itemB = page.locator('[data-testid="sel01-item-b"]');
  const itemC = page.locator('[data-testid="sel01-item-c"]');

  await expect(itemA).toHaveAttribute('aria-disabled', 'true');
  await expect(itemB).toHaveAttribute('aria-disabled', 'true');
  await expect(itemC).not.toHaveAttribute('aria-disabled', 'true');

  expect(warnings.some((w) => /Select/i.test(w) && /duplicate/i.test(w))).toBe(true);

  // Disabled items do not select on press.
  await itemA.click({ force: true });
  await expect(page.locator('[data-testid="sel01-value-readout"]')).toHaveText('value: (none)');
});

test('SEL-02: removing the selected option does not synthesize a value change; SelectValue falls back to its placeholder', async ({
  page,
}) => {
  await gotoAuditHarness(page);
  const valueText = page.locator('[data-testid="sel02-value"]');
  const readout = page.locator('[data-testid="sel02-value-readout"]');

  await expect(valueText).toHaveText('Removable option');
  await expect(readout).toHaveText('value: keep');

  await page.locator('[data-testid="sel02-remove-selected"]').click();

  await expect(valueText).toHaveText('No selection');
  // The parent's controlled `value` state is unchanged: no onValueChange was
  // synthesized by removing the currently-selected item from the list.
  await expect(readout).toHaveText('value: keep');
});
