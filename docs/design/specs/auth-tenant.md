# Auth, tenant and chain ops specs

Part of the BeePOS design system. Foundations (breakpoints, tokens, icons, type, density,
dark mode, copy) live in [`../design-direction.md`](../design-direction.md); this file holds
the account, session and chain operations specs. Mockups: `mockups/auth.html`, `mockups/chain-ops.html`.

## Rules

1. **Identity is email plus password**; the org comes from the account, so login has no chain
   or store code field. PIN is never a login credential, it only unlocks the screen and
   switches cashier, and it is unique per org.
2. **Session order is store then register**, register skipped when the store has one.
   `Session` carries `orgId`, `userId`, `staffId`, `storeId`, `registerId`; changing register
   means logging in again or closing the shift.
3. **Onboarding is 3 `stepper` steps**: chain, first store plus register, owner account.
   Currency is locked to VND and says why; the org code warns it is permanent because it enters
   order codes and the persistence key.
4. **Lock screen** is full screen: 72 pt PIN keys, current cashier avatar and name, no close
   control, and `Đổi thu ngân` for another staff's PIN. Auto-lock after N minutes lives in
   Settings, default 5. Unlocking never touches the cart or the open orders.
5. **Permissions are a matrix**, roles as columns, permissions as rows grouped by area, the
   permission code under the Vietnamese label. The owner column is checked, muted and locked
   with a lock glyph in its header: visible, not editable. A denied permission hides its
   control rather than showing a dead one.
6. **Account status**: `success` Đang hoạt động, `warning` Đã mời, `destructive` Đã khoá, and
   a disabled row also drops to 45 percent opacity.
7. **Suppliers are an entity, not free text**; receipts pick from the list and offer `Thêm nhà
   cung cấp mới` inside the flow. **Store prices** show base, override and effective in one row
   per store including stores with no override; POS reads the effective price of the session store.
8. **Cash movements** use 4 reason chips (Nộp tiền, Rút tiền, Chi vặt, Khác) plus a note and
   show the drawer balance before and after; pushed route on phone, `dialog` on desktop, Sheet
   still banned. **The Z report** is a 320 pt monospace receipt on the real print path, not a
   screen table; print and close shift are one action and explanation never goes on the sheet.
9. **The audit log is read only**, gated by `audit.view`: no row actions, no edit, no delete,
   summary column a sentence carrying amounts and the old value. **Never claim the prototype
   sent an email**: invites and reset codes say the link or code appears in a Toast.
