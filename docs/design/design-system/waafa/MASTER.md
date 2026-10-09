# WAAFA design system: master file (UI UX Pro Max, reconciled)

> **How to use:** when building a page, read `pages/<page>.md` first; its rules override this file. Where anything
> here or in a page file disagrees with `docs/design/DESIGN.md` or PRD §16, those win (Decision D6).
> Tokens live in `apps/web/src/app/globals.css`; never hard-code a value from this file.

**Project:** WAAFA (Waafa Tours and Travel + Waafas World) · **Category:** travel agency + single-vendor store ·
**Generated:** 9 Oct 2026 with `search.py --design-system --persist -p "WAAFA"`, then reconciled by hand (A1b, #34).

## What the generator proposed, and what we kept

| Area | Generator default | WAAFA decision | Why |
| --- | --- | --- | --- |
| Pattern | Minimal single column, one CTA | Search-first hero (headline, inset media panel, glass search card), then 12 data-driven sections | An OTA's first job is the search; PRD FR-HOME order |
| Style | Gradient mesh / aurora | Calm, premium, airline-lounge; the W ribbon gradient once per view; glass only on the search card | PRD §16; mesh gradients read as AI-generated |
| Colour | Sky `#0EA5E9`, orange CTA `#F97316`, `#F0F9FF` background | Electric-600 primary, navy-900 headings, ink-900 text, mist neutrals, gold only for the triangle | Brand hex values in PRD §16 are fixed |
| Typography | Cormorant + Montserrat | Plus Jakarta Sans (display, 700/800) + Inter (UI and body, 16 px on phones); "Waafa Taka" subset for ৳ | PRD §16 (D6, D22) |
| Shadows | Neutral black shadows | Navy-tinted, layered shadows | Taste rule: tint shadows to the hue |
| Kept as-is | Spacing scale 4/8, 44 px targets, 150–300 ms micro-interactions, transform/opacity only, reduced motion, 375/768/1024/1440 checks, no emoji icons, cursor-pointer, visible focus | Same | Generic and correct |

## Global rules (summary of DESIGN.md)

### Colour (tokens in `globals.css`)
| Role | Token | Hex |
| --- | --- | --- |
| Primary action, focus ring | `electric-600` (`--primary`, `--ring`) | `#0053D7` |
| Hover, links | `brand-700` | `#003FBE` |
| Pressed | `royal-800` | `#01278B` |
| Headings, navy buttons | `navy-900` | `#00185B` |
| Dark bands | `midnight-950` | `#020D39` |
| Text | `ink-900` | `#0E1424` |
| Secondary text | `mist-600` | `#556078` |
| Borders and hairlines | `mist-300`, `mist-200` | `#CDD5E2`, `#E3E8F0` |
| Panels, footer | `mist-50` | `#F6F8FB` |
| Accent on dark only | `cyan-400` | `#39CCE9` |
| Premium marker only (never text) | `gold-600` | `#A8782F` |
| Status | `success-600`, `warning-700`, `danger-600`, `whatsapp-700` | `#0B7A54`, `#A15C07`, `#C2261D`, `#0E7A47` |

Ribbon gradient (120°): midnight-950 → brand-700 → sky-500 → cyan-400, once per view.

### Typography
- Display and headings: Plus Jakarta Sans 700/800, tight tracking at large sizes, navy-900, one colour per heading
  (only the home hero's second line is electric). Body and UI: Inter 400/500/600, 16 px body on phones, 1.5–1.6
  line height, 65–75 characters per line. Figures (prices, dates, times): tabular, Plus Jakarta Sans 800 for prices.
- Utilities: `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-lead`, `type-label`, `type-caption`.

### Layout and shape
- Container 1320 px; gutters 16 / 28 / 40 px; section spacing 44 / 64 / 88 px (phone / tablet / desktop).
- Radius: 6 small, 8 inputs and chips, 12 cards' inner parts, 16 cards, 20 panels, 28 search card and sheets,
  full pills for buttons (48 / 38 / 56 px tall; icon buttons 44 px).
- Grids declare `grid-cols-1` at the phone base; bento only where it means something (Why Waafa, team, store home).
- Header 64 px phone, 72 px desktop; bottom tab bar on phones with the raised W disc.

### Interaction and motion
- Every interactive element has hover, focus-visible, pressed, disabled and loading states; 44 px targets.
- Motion per `docs/design/MOTION.md`: transform and opacity only, 150–300 ms UI, 420–560 ms entrances, springs for
  tabs and sheets, reduced motion → 150 ms fades.

### Content
- ৳ with lakh grouping (৳1,46,480), VAT included; dates "12 Oct 2026"; Asia/Dhaka; +880 phones; real photos only.
- No emoji, lorem ipsum, fake numbers, invented reviews or filler words (elevate, seamless, unleash, discover).

## Pre-delivery checklist (every PR)
- [ ] No emoji icons; Lucide or `components/brand` only; brand logos from Simple Icons
- [ ] `cursor-pointer` on everything clickable; hover feedback without layout shift
- [ ] Text contrast ≥ 4.5:1 (3:1 for large text and UI parts); focus visible
- [ ] `prefers-reduced-motion` respected; transforms and opacity only
- [ ] 320 / 390 / 768 / 1024 / 1440 checked; no horizontal scroll; nothing hidden behind the header or tab bar
- [ ] Images have alt text; inputs have labels; colour is never the only signal
- [ ] Skeleton, empty and error states designed
