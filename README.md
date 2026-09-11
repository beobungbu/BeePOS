# BeePOS

Interactive UI prototype of a POS for a Vietnamese grocery chain (tạp hoá). One Expo codebase
for iOS, Android, and Web. UI only, in-memory mock data, no backend. Also a field test of
[BeeUI](https://beeui.beemvp.com) as an outside npm consumer, see `docs/beeui-audit/`.

## Run

```bash
npm install
npm run web       # or npm run ios / npm run android
```

Log in with any store code from the seed (`HN01`, `HN02`, `HCM01`, `DN01`) and PIN `1234`.

## Structure

- `app/` — expo-router routes: `(auth)` for login/select-store, `(app)` for the shell and
  every area (POS, orders, products, inventory, customers, reports, stores, staff, settings).
- `src/domain/` — pure, unit-tested types and money helpers.
- `src/data/` — deterministic seed data (`seed/`) and zustand stores per entity.
- `src/i18n/` — `vi`/`en` dictionaries, merge point in `src/i18n/index.ts`.
- `src/theme/` — Uniwind runtime theme wiring.
- `src/components/shell/` — responsive shell (sidebar on wide screens, bottom tabs on narrow).

## Scripts

- `npm run typecheck` — `tsc --noEmit`
- `npm test` — jest unit tests (`src/domain`)
- `npm run export:all` — `expo export` for web, iOS, Android

## BeeUI audit

Every friction point found while consuming BeeUI's public docs and npm packages is logged
under `docs/beeui-audit/findings-*.md` per `docs/beeui-audit/protocol.md`.
