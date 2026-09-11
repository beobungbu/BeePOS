import { expect, test } from '@playwright/test';
import { gotoAuditHarness } from './helpers';

// ADLG-01, DLG-01, DLG-02 (docs/beeui-audit/behavior-claims.md)

test('ADLG-01: AlertDialog never closes from backdrop press or Escape, but an explicit action closes it', async ({
  page,
}) => {
  await gotoAuditHarness(page);
  const content = page.locator('[data-testid="adlg01-content"]');
  const overlay = page.locator('[data-testid="adlg01-overlay"]');

  await page.locator('[data-testid="adlg01-trigger"]').click();
  await expect(content).toBeVisible();
  await expect(content).toHaveAttribute('role', 'dialog');

  await page.keyboard.press('Escape');
  await expect(content).toBeVisible();

  await overlay.click({ position: { x: 5, y: 5 } });
  await expect(content).toBeVisible();

  await page.locator('[data-testid="adlg01-cancel"]').click();
  await expect(content).toBeHidden();
});

test('DLG-01: open without onOpenChange warns in development and falls back to dismissable behavior', async ({
  page,
}) => {
  await gotoAuditHarness(page);
  const warnings: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'warning') warnings.push(msg.text());
  });

  const content = page.locator('[data-testid="dlg01-content"]');
  await page.locator('[data-testid="dlg01-mount"]').click();
  await expect(content).toBeVisible();

  await expect
    .poll(() => warnings.some((w) => /Dialog/i.test(w) && /onOpenChange/i.test(w)))
    .toBe(true);

  // Falls back to dismissable (uncontrolled) behavior: even though the parent still
  // passes a fixed open={true} with no handler, Escape now closes it.
  await page.keyboard.press('Escape');
  await expect(content).toBeHidden();
});

test('DLG-02: backdrop press and Escape route through one close policy; dismissOnEscape opts Escape out independently', async ({
  page,
}) => {
  await gotoAuditHarness(page);

  // Default dialog: both Escape and backdrop press close it (each re-opened between checks).
  const defaultContent = page.locator('[data-testid="dlg02-default-content"]');
  const defaultOverlay = page.locator('[data-testid="dlg02-default-overlay"]');
  const defaultTrigger = page.locator('[data-testid="dlg02-default-trigger"]');

  await defaultTrigger.click();
  await expect(defaultContent).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(defaultContent).toBeHidden();

  await defaultTrigger.click();
  await expect(defaultContent).toBeVisible();
  await defaultOverlay.click({ position: { x: 5, y: 5 } });
  await expect(defaultContent).toBeHidden();

  // dismissOnEscape=false dialog: Escape does not close it, but backdrop press
  // (an independent channel) still does.
  const noEscapeContent = page.locator('[data-testid="dlg02-noescape-content"]');
  const noEscapeOverlay = page.locator('[data-testid="dlg02-noescape-overlay"]');
  await page.locator('[data-testid="dlg02-noescape-trigger"]').click();
  await expect(noEscapeContent).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(noEscapeContent).toBeVisible();

  await noEscapeOverlay.click({ position: { x: 5, y: 5 } });
  await expect(noEscapeContent).toBeHidden();
});
