import { expect, test } from '@playwright/test';
import { gotoAuditHarness } from './helpers';

// SHEET-01 (docs/beeui-audit/behavior-claims.md)

test('SHEET-01: Sheet dismissal routes through the same dismissOnRequestClose contract Dialog uses', async ({
  page,
}) => {
  await gotoAuditHarness(page);

  // Default sheet: Escape and backdrop press both close it, same as Dialog's default.
  const defaultContent = page.locator('[data-testid="sheet01-default-content"]');
  const defaultOverlay = page.locator('[data-testid="sheet01-default-overlay"]');
  const defaultTrigger = page.locator('[data-testid="sheet01-default-trigger"]');

  await defaultTrigger.click();
  await expect(defaultContent).toBeVisible();
  await expect(defaultContent).toHaveAttribute('role', 'dialog');
  await page.keyboard.press('Escape');
  await expect(defaultContent).toBeHidden();

  await defaultTrigger.click();
  await expect(defaultContent).toBeVisible();
  await defaultOverlay.click({ position: { x: 5, y: 5 } });
  await expect(defaultContent).toBeHidden();

  // dismissOnRequestClose=false: every implicit dismiss path (Escape, backdrop) is a
  // no-op; only the explicit SheetClose still closes it.
  const noCloseContent = page.locator('[data-testid="sheet01-noclose-content"]');
  const noCloseOverlay = page.locator('[data-testid="sheet01-noclose-overlay"]');
  await page.locator('[data-testid="sheet01-noclose-trigger"]').click();
  await expect(noCloseContent).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(noCloseContent).toBeVisible();

  await noCloseOverlay.click({ position: { x: 5, y: 5 } });
  await expect(noCloseContent).toBeVisible();

  await page.locator('[data-testid="sheet01-noclose-close"]').click();
  await expect(noCloseContent).toBeHidden();
});
