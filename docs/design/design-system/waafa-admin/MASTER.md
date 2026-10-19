# WAAFA Admin design system: master file (UI UX Pro Max, reconciled)

> **How to use:** when building an admin screen, read `pages/<page>.md` first; its rules override this file. Where
> anything here disagrees with `docs/design/ADMIN.md`, `docs/design/DESIGN.md` or PRD §16, those win (D6, D183).
> Tokens live in `apps/web/src/app/globals.css`; never hard-code a value from this file.

**Project:** WAAFA Admin (`/secure-admin-control`) · **Category:** back office for a travel agency and a single-vendor
store, used by non-technical staff in Bangladesh · **Generated:** 19 Oct 2026 with
`search.py "admin back office for a travel agency and an e-commerce store, non-technical staff, Bangladesh, calm and clear, dense only where needed" --design-system --persist -p "WAAFA Admin"`
and `--page` dashboard, list-table, editor-form, media-library, inbox; reconciled by hand in R0 (#190).

## What the generator proposed, and what we kept

| Area | Generator default | WAAFA Admin decision | Why |
| --- | --- | --- | --- |
| Pattern | App Store style landing (hero, screenshots, reviews, download CTAs) | Sidebar + main; list-detail inbox for work items; sectioned editor with a right rail | It matched "travel agency"; the admin is a working tool, not a landing page |
| Style | Minimalism & Swiss Style | **Kept**: clean, functional, grid-based, high contrast, essential; dense only in tables and inboxes | Fits staff work; WCAG AAA-friendly |
| Colour | Sky `#0EA5E9`, orange CTA `#F97316`, `#F0F9FF` background, text `#0C4A6E` | Electric-600 actions, navy-900 headings, ink-900 text, mist neutrals, midnight-950 sidebar; status families from ui-color-palette (ADMIN.md §4.1) | PRD §16 brand hex values are fixed; one accent for actions |
| Typography | Fira Code + Fira Sans | Plus Jakarta Sans titles, Inter UI (14.5 px tables, 16 px forms), tabular figures for money and dates | PRD §16 (D6) |
| Shadows | Neutral black, lift on hover | Flat panels with hairlines; navy-tinted shadows only for popovers, sheets and dialogs; no lift on cards | Calm; hover lift shifts dense layouts |
| Buttons | Orange CTA with translateY hover | Pill buttons from `components/ui/button.tsx`; one primary per header; no movement on hover | Brand buttons already exist |
| Kept as-is | Spacing scale 4/8/16/24/32/48, 44 px targets, 150–300 ms transitions, visible focus, reduced motion, no emoji icons, cursor-pointer, 375/768/1024/1440 checks | Same | Generic and correct |

## Global rules (summary of ADMIN.md)
- Plain words only; every page header = title + one line + one primary action.
- Lists: one DataTable (thumbnail + name first, status chip, key facts, server pagination, cards below 768 px).
- Editing: sectioned editor, sticky action bar, right rail (status, visibility, preview, SEO, history).
- Work items: inbox (list + detail with action buttons + timeline), fully usable at 390 px.
- No status dropdowns: actions and dates set status; every chip = icon + word + colour + "why" tooltip.
- Motion 150–200 ms; reduced motion = fades only.

## Pre-delivery checklist (every admin PR)
- [ ] No emojis as icons; lucide only, sizes 16/18/20
- [ ] `cursor-pointer` and visible focus on every interactive element
- [ ] Hover and state transitions 150–200 ms, no layout shift
- [ ] Text contrast ≥ 4.5:1 (status chips ≥ 6.2:1)
- [ ] No ID, slug, src, JSON, key or enum value on screen (Advanced excepted)
- [ ] 390 / 768 / 1024 / 1440: no horizontal scroll; inbox jobs complete at 390 px
- [ ] Keyboard pass and axe pass; reduced motion respected
