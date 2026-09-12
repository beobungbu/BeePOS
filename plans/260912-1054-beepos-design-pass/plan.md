# BeePOS design pass

Status: phase 1 DONE (approved), phase 2 IN PROGRESS · 2026-09-12 · owner: Ambrose

Why: day-one build skipped visual design (spec had one line on layout). Result works but looks unfinished on phone, tablet and desktop: emoji icons, left-pinned forms, truncated product names, category chips eating half the phone screen, no hierarchy.

## Phases
| # | Phase | Owner | Status |
|---|---|---|---|
| 1 | Research + design direction + wireframes for 5 key screens x 3 breakpoints, user review gate | ui-ux-designer agent | IN PROGRESS |
| 2 | Restyle all 31 screens per approved direction: 2A foundation then 2B three parallel screen workers, screenshot acceptance at 3 viewports, E2E green | fullstack workers | IN PROGRESS (approved 2026-09-12 13:24) |

## Acceptance (phase 1)
- `docs/design/research.md`, `docs/design/design-direction.md`, `docs/design/mockups/index.html` exist and follow the phase file.
- Mockups open in a browser and show 5 screens at 375, 768, 1440 widths.
- Every mockup region names the BeeUI component that will render it.
- No em-dash in any user-facing copy.

Phase files: `phase-01-research-direction-wireframes.md`

## Owner decisions (2026-09-12)
- POS must hold several open orders at once (tabs); paying one returns to the next open order.
- Product images are in. Seed images: generic grocery photos from a free-license stock source (Pexels/Unsplash), ~40 shared by category, bundled in repo. Owner chose this over supplying real product photos.
- Brand stays BeeUI amber; shift-not-open is a nudge, not a gate; orders preview pane kept but must not clip the table; F keys web only; dark render checked in phase 2.
Phase files: `phase-01-research-direction-wireframes.md`, `phase-02-restyle.md`
