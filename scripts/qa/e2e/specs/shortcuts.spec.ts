import { expect, test } from '@playwright/test';
import { collectErrors, go, login } from '../lib/session';
import { V, orderTabs, overlay } from '../lib/flows';

/**
 * The app-level shortcuts while the caret is in the catalogue search, which is where it sits
 * for most of a shift. The listeners are on the capture phase for exactly this reason, and
 * nothing covered it before: a regression here is silent, because both shortcuts simply stop
 * happening and the cashier blames the keyboard.
 *
 * Desktop only: these are web keyboard chords, and the phone shell has no keyboard.
 */
test.describe('keyboard shortcuts', () => {
  // Playwright requires the fixtures argument to be a destructuring pattern, even here.
  // eslint-disable-next-line no-empty-pattern
  test.beforeEach(({}, testInfo) => {
    test.skip(testInfo.project.name !== 'wide', 'web keyboard chords, desktop shell');
  });

  test('Cmd/Ctrl+K and Alt+N still fire with the catalogue search focused', async ({ page }) => {
    const { errors } = collectErrors(page);
    await login(page);
    await go(page, '/pos');

    const search = page.getByPlaceholder(/mã vạch|barcode/i);
    await search.click();
    await search.fill('coca');
    await expect(search).toBeFocused();

    await test.step('Alt+N opens an order without disturbing the query', async () => {
      await expect(orderTabs(page)).toHaveCount(1);
      await page.keyboard.press('Alt+n');
      await expect(orderTabs(page)).toHaveCount(2);
      await expect(page.getByRole('button', { name: `${V.closePrefix} Đơn 2` })).toBeVisible();
      // The chord is swallowed by the shortcut, so the field keeps what was typed.
      await expect(search).toHaveValue('coca');
      await expect(search).toBeFocused();
    });

    await test.step('Cmd/Ctrl+K opens the command palette', async () => {
      await page.keyboard.press('ControlOrMeta+k');
      const palette = overlay(page).last();
      await expect(palette).toBeVisible();
      await expect(palette).toContainText(V.commandPaletteTitle);
      await palette.getByPlaceholder(V.commandPalettePlaceholder).fill('Đơn hàng');
      await expect(palette.getByText('Màn hình').first()).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(overlay(page)).toHaveCount(0);
    });

    await test.step('Alt+N is ignored while a dialog is open', async () => {
      await page.getByRole('button', { name: V.orderDiscount }).click();
      await expect(overlay(page).last()).toBeVisible();
      await page.keyboard.press('Alt+n');
      await expect(orderTabs(page)).toHaveCount(2);
      await page.keyboard.press('Escape');
      await expect(overlay(page)).toHaveCount(0);
    });

    expect(errors, errors.join('\n')).toEqual([]);
  });
});
