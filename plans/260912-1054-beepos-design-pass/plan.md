# BeePOS design pass

Status: phase 1 IN PROGRESS · 2026-09-12 · owner: Ambrose

Why: day-one build skipped visual design (spec had one line on layout). Result works but looks unfinished on phone, tablet and desktop: emoji icons, left-pinned forms, truncated product names, category chips eating half the phone screen, no hierarchy.

## Phases
| # | Phase | Owner | Status |
|---|---|---|---|
| 1 | Research + design direction + wireframes for 5 key screens x 3 breakpoints, user review gate | ui-ux-designer agent | IN PROGRESS |
| 2 | Restyle all 31 screens per approved direction, screenshot acceptance at 3 viewports, E2E green | fullstack worker(s) | PENDING (after user approves phase 1) |

## Acceptance (phase 1)
- `docs/design/research.md`, `docs/design/design-direction.md`, `docs/design/mockups/index.html` exist and follow the phase file.
- Mockups open in a browser and show 5 screens at 375, 768, 1440 widths.
- Every mockup region names the BeeUI component that will render it.
- No em-dash in any user-facing copy.

Phase files: `phase-01-research-direction-wireframes.md`
