---
version: 1.0
name: WAAFA
description: >
  Calm, premium and confident. An airline-lounge palette (midnight, navy and electric blue on white, silver hairlines)
  sampled from the WAAFA logo; one flowing ribbon motif taken from the W mark; a small gold triangle as the only premium
  marker; real destination photography with one cool grade; Plus Jakarta Sans headings over Inter body text; soft 12-16 px
  radii, navy-tinted shadows, and glass on the search card only. Light theme for the public site at launch.
colors:
  canvas: "#FFFFFF"
  surface-subtle: "#F6F8FB"      # mist-50: panels, footer, alternate sections
  surface-muted: "#EFF2F7"       # mist-100: tracks, skeletons, disabled fills
  surface-dark: "#020D39"        # midnight-950: dark bands, hero overlays, admin sidebar
  primary: "#0053D7"             # electric-600: primary buttons, active states, focus ring
  primary-hover: "#003FBE"       # brand-700: hover, links on white
  primary-active: "#01278B"      # royal-800: pressed
  primary-soft: "#EEF4FF"        # electric-50: soft buttons, selected rows
  on-primary: "#FFFFFF"
  heading: "#00185B"             # navy-900
  ink: "#0E1424"                 # ink-900: default text (shadcn --foreground)
  body-secondary: "#556078"      # mist-600: secondary text, 6.3:1
  muted: "#6B7489"               # mist-500: captions on white only, 4.7:1
  hairline: "#E3E8F0"            # mist-200: card borders, dividers
  input-border: "#CDD5E2"        # mist-300
  accent-sky: "#0D8CEE"          # sky-500: icons, charts; never body text
  accent-cyan: "#39CCE9"         # cyan-400: highlights on dark only
  silver: "#D7D3D0"              # silver-300: chrome edges on dark
  gold: "#A8782F"                # gold-600: triangle marker only, never text
  success: "#0B7A54"
  success-bg: "#E7F6EF"
  warning: "#A15C07"
  warning-bg: "#FFF4E2"
  danger: "#C2261D"
  danger-bg: "#FDEDEB"
  whatsapp: "#0E7A47"            # whatsapp-700: button fill with white text, 5.4:1
typography:
  display: { fontFamily: "Plus Jakarta Sans", fontSize: "34px -> 48px -> 60px", fontWeight: 800, lineHeight: "1.06", letterSpacing: "-0.035em -> -0.04em" }
  h1: { fontFamily: "Plus Jakarta Sans", fontSize: "28px -> 36px -> 44px", fontWeight: 700, lineHeight: "1.12", letterSpacing: "-0.03em" }
  h2: { fontFamily: "Plus Jakarta Sans", fontSize: "24px -> 30px -> 36px", fontWeight: 700, lineHeight: "1.18", letterSpacing: "-0.026em" }
  h3: { fontFamily: "Plus Jakarta Sans", fontSize: "19px -> 22px", fontWeight: 700, lineHeight: "1.25", letterSpacing: "-0.018em" }
  lead: { fontFamily: "Inter", fontSize: "15.5px -> 17.5px", fontWeight: 400, lineHeight: "1.55" }
  body: { fontFamily: "Inter", fontSize: "16px", fontWeight: 400, lineHeight: "1.5" }
  body-dense: { fontFamily: "Inter", fontSize: "15px", fontWeight: 400, lineHeight: "1.6" }
  label: { fontFamily: "Inter", fontSize: "13.5px -> 15px", fontWeight: 600, lineHeight: "1.25" }
  caption: { fontFamily: "Inter", fontSize: "12.5px -> 13px", fontWeight: 500, lineHeight: "1.4" }
  button-md: { fontFamily: "Inter", fontSize: "15px", fontWeight: 600, lineHeight: "1" }
  button-lg: { fontFamily: "Inter", fontSize: "16px", fontWeight: 600, lineHeight: "1" }
  figure: { fontFamily: "Plus Jakarta Sans", fontWeight: 800, fontFeature: "tnum" }   # times, fares, references
rounded:
  none: 0
  xs: 6px      # tags, small badges
  sm: 8px      # small buttons, menu items
  md: 12px     # inputs
  lg: 16px     # cards
  xl: 20px     # panels, dialogs
  2xl: 28px    # search card, sheet tops
  full: 9999px # buttons, chips, pills, tab indicator
spacing:
  base: 4px
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px     # phone gutter
  lg: 24px
  xl: 28px     # tablet gutter
  2xl: 40px    # desktop gutter
  section-phone: 44px
  section-tablet: 64px
  section-desktop: 88px
  container: 1320px
components:
  button-primary: { backgroundColor: "{colors.primary}", textColor: "{colors.on-primary}", typography: "{typography.button-md}", rounded: "{rounded.full}", height: 48px, padding: "0 20px" }
  button-primary-hover: { backgroundColor: "{colors.primary-hover}" }
  button-primary-active: { backgroundColor: "{colors.primary-active}", transform: "scale(0.98)" }
  button-primary-disabled: { backgroundColor: "{colors.surface-muted}", textColor: "#A3ADBF" }
  button-secondary: { backgroundColor: "{colors.canvas}", textColor: "{colors.heading}", border: "1px {colors.input-border}", rounded: "{rounded.full}", height: 48px }
  button-soft: { backgroundColor: "{colors.primary-soft}", textColor: "{colors.primary-hover}", rounded: "{rounded.full}", height: 48px }
  button-whatsapp: { backgroundColor: "{colors.whatsapp}", textColor: "#FFFFFF", rounded: "{rounded.full}", height: 48px }
  button-lg: { height: 56px, padding: "0 28px", typography: "{typography.button-lg}", rounded: "{rounded.full}" }
  button-sm: { height: 38px, padding: "0 14px", rounded: "{rounded.full}" }
  input: { backgroundColor: "#FFFFFF", border: "1px {colors.input-border}", rounded: "{rounded.md}", height: 52px, fontSize: 16px }
  input-focus: { border: "1px {colors.primary}", ring: "3px rgb(0 83 215 / .16)" }
  input-error: { border: "1px {colors.danger}", helperColor: "{colors.danger}" }
  card: { backgroundColor: "#FFFFFF", border: "1px {colors.hairline}", rounded: "{rounded.lg}", shadow: "none -> shadow-md on hover (desktop)" }
  search-card: { backgroundColor: "rgb(255 255 255 / .86)", backdropFilter: "blur(18px) saturate(1.4)", rounded: "{rounded.2xl}", shadow: "shadow-glass" }
  chip: { height: 32px, padding: "0 12px", rounded: "{rounded.full}", typography: "{typography.label}" }
  badge: { height: 24px, padding: "0 9px", rounded: 7px, fontSize: 12px, fontWeight: 600 }
  badge-premium: { backgroundColor: "{colors.heading}", textColor: "#FFFFFF", marker: "gold triangle 9x8 px" }
  header: { height: "64px phone / 72px desktop", backgroundColor: "transparent over the home hero -> #FFFFFF with blur after 24px" }
  tab-bar: { height: 64px, backgroundColor: "#FFFFFF", indicator: "ribbon pill, layoutId, spring 500/38" }
---

# WAAFA design system

`DESIGN.md` says how WAAFA should look and feel; `CLAUDE.md` says how to build it. Values mirror
`docs/design/handoff/tokens.css` (copied into `apps/web/src/app/globals.css`) and the prototype boards
`Brand`, `Tokens`, `Components`, `MotionKit` and `Motion`. Motion lives in `docs/design/MOTION.md`.
The competitive bar is in `docs/design/COMPETITOR_BENCHMARK.md`.

## 1. Overview: visual theme and atmosphere

**Design read.** A trust-first travel and commerce site for first-time international travellers on mid-range Android
phones, families, office managers and diaspora customers. The language is an airline lounge: quiet, ordered, generous with
white space, exact with numbers. It must feel premium without feeling expensive, and human ("our travel expert will call
you") rather than automated.

**Dials** (taste skill): `DESIGN_VARIANCE 6 · MOTION_INTENSITY 5 · VISUAL_DENSITY 4`. Trust-first commerce pulls variance
and motion below the landing-page default; asymmetry is used in a few places (hero, team bento, Waafas World band), never
in forms or results.

**Three signatures, used with restraint.**
1. **The ribbon.** The W mark's flowing band (`--ribbon`, 120°, #020D39 → #003FBE → #0D8CEE → #39CCE9) appears as the hero
   underlay, the active-tab pill, a section divider and the loader in which the W draws itself. Once per view, at most twice.
   Never a background wash.
2. **The gold triangle.** Lifted from the A's in the wordmark: a 9 × 8 px gold triangle marks curated items only
   (Best seller, Featured, Group departure). Gold never carries text (#A8782F on white is 3.9:1).
3. **The glass search card.** The only frosted surface on the site, with a sliding tab pill and a border beam on desktop.

**Boarding-pass detail.** IATA codes set large, dashed flight paths, ticket-stub notches on fare cards and tabular figures
for every time, reference number and taka amount. This is Waafa's own card language for travel; the store uses clean
product cards in the same tokens.

## 2. Colors

| Role | Token | Hex | Use | Contrast on white |
| --- | --- | --- | --- | --- |
| Brand / primary | electric-600 | #0053D7 | Primary buttons, active states, focus ring | 6.5:1 (white text on it 6.5:1) |
| Brand / hover | brand-700 | #003FBE | Hover, links on white | 8.6:1 |
| Brand / pressed | royal-800 | #01278B | Pressed, hover on navy | 12.6:1 |
| Headings | navy-900 | #00185B | Headings, navy UI | 16.4:1 |
| Dark surface | midnight-950 | #020D39 | Dark bands, overlays, admin sidebar | 18.8:1 |
| Accent | sky-500 | #0D8CEE | Icons, charts | 3.5:1, no body text |
| Accent on dark | cyan-400 | #39CCE9 | Highlights and gradients on dark only | 9.8:1 on midnight |
| Premium marker | gold-600 | #A8782F | The triangle only | 3.9:1, never text |
| Metallic | silver-300 / silver-500 | #D7D3D0 / #9F9B9C | Hairlines and chrome edges on dark | decorative |
| Text | ink-900 | #0E1424 | Default text | 18.1:1 |
| Text secondary | mist-600 | #556078 | Secondary text, captions on mist-50 | 6.3:1 |
| Text muted | mist-500 | #6B7489 | Captions on white only | 4.7:1 |
| Surfaces | white / mist-50 / mist-100 | #FFFFFF / #F6F8FB / #EFF2F7 | Page / panels and footer / tracks and skeletons | |
| Borders | mist-200 / mist-300 | #E3E8F0 / #CDD5E2 | Cards / inputs | |
| Success | success-600 on success-50 | #0B7A54 / #E7F6EF | Booked, In stock, sent | 5.4:1 |
| Warning | warning-700 on warning-50 | #A15C07 / #FFF4E2 | Low stock, pending | 5.2:1 |
| Danger | danger-600 on danger-50 | #C2261D / #FDEDEB | Errors, cancelled | 5.9:1 |
| WhatsApp | whatsapp-700 | #0E7A47 | WhatsApp buttons | 5.4:1 with white |

Rules: one accent family (the blues). Status never relies on hue alone (icon or word with every state). Shadows are
navy-tinted (`rgb(2 13 57 / x)`), never pure black. No purple, no orange sale banners, no neon glows.
`--primary` is electric-600 (PRD §16 and the prototype's primary button); `tokens.css` maps it to brand-700, which we use
for hover (decision D8 in TRACKER).

## 3. Typography

Plus Jakarta Sans (600-800) for display and headings, Inter (400-800) for body and interface, both through `next/font`,
self-hosted, `display: swap`. Hind Siliguri joins for Bangla in P1. The Brand board proposed Atkinson Hyperlegible Next
as an alternative body face; the PRD default pairing stays (decision D6).

| Token | Phone → tablet → desktop | Weight · tracking | Example |
| --- | --- | --- | --- |
| display | 34/36 → 48 → 60/64 | PJS 800 · −0.035 to −0.04em | Tell us where. |
| h1 | 28/32 → 36 → 44/50 | PJS 700 · −0.03em | Tour packages from Dhaka |
| h2 | 24/28 → 30 → 36/42 | PJS 700 · −0.026em | Popular destinations |
| h3 | 19/24 → 22/28 | PJS 700 · −0.018em | Maldives island escape |
| lead | 15.5/24 → 17.5/27 | Inter 400 | Compared by our experts and confirmed with you on call or WhatsApp. |
| body | 16/24 (15/24 dense tables) | Inter 400 | Every search becomes a query our team answers. |
| label | 13.5-15/20 | Inter 600 | Phone number |
| caption | 12.5-13/18 | Inter 500 | Fares are indicative until confirmed by our team. |
| figure | inherits size | PJS 800, `tnum` | 07:45 · ৳58,500 · FLT-261008-0042 |

Principles: headings are one colour (navy) with no accent word, except the home hero headline whose second line takes
electric-600 (the one accent on the site, per the Stage A research); sentence case everywhere; no all-caps
labels except the rare eyebrow (at most one per three sections); `text-wrap: balance` on headings; line length under 75
characters; inputs at 16 px so iOS never zooms on focus. Money: ৳ with Indian grouping (৳1,46,480), VAT included.
Dates: "12 Oct 2026". Times: 24-hour in fare cards ("19:40"), 12-hour in office hours ("10 am to 6 pm").

## 4. Layout

- **Grid.** Container 1320 px, gutters 16 / 28 / 40 px (phone / tablet / desktop). 4 px spacing base.
  Section padding 44 / 64 / 88 px. CSS Grid for layouts, never percentage flex maths.
- **No blow-outs.** Every grid declares `grid-cols-1` at the phone base (a `minmax(0, 1fr)` track), so a carousel,
  a long word or a row of OTP boxes can never widen the page. Carousels contain their inline size.
- **Phone first.** Design at 390 px, verify at 320 px, then 768, 1024, 1280 and 1440.
- **Rhythm.** Each section has one job and one layout family; no family repeats more than once on a page (taste skill).
  The home page alternates: search hero → trust strip → carousel → fare cards → image grid → horizontal scroll → list →
  value cards → store band → testimonials → mixed strip → bento → CTA band.
- **Whitespace.** Lots of it around the search card and section headings; dense only inside results, tables and admin.
- **Alignment.** Left-aligned headings and content; centred only for empty states, success screens and the final CTA band.

## 5. Elevation and depth

| Token | Value | Use |
| --- | --- | --- |
| shadow-xs | 0 1px 2px rgb(2 13 57 / .06) | inputs, chips |
| shadow-sm | 0 1px 3px / .08 + 0 1px 2px / .04 | resting cards that need lift |
| shadow-md | 0 10px 24px −8px / .14 + 0 2px 4px / .04 | card hover |
| shadow-lg | 0 20px 48px −16px / .22 + 0 4px 12px −4px / .06 | popovers, lifted cards |
| shadow-xl | 0 36px 80px −28px / .34 + 0 8px 20px −8px / .08 | menus, sheets |
| shadow-glass | 0 28px 70px −28px / .45 + inset highlight | search card only |

Surfaces: white page → mist-50 panels → white cards with a mist-200 hairline. Cards rest flat (border only); shadow appears
on hover or when a card floats above a photo. Dark bands (midnight) are used at most twice per page and never under the logo.

## 6. Components

All primitives are shadcn/ui (Radix) restyled with these tokens; effects come from the 21st.dev list in HANDOFF, rebuilt in
`components/fx`. Every interactive component ships hover, focus-visible (2 px electric ring + 2 px offset), active (scale
0.98 or 1 px press), disabled and loading states.

- **Logo lockup.** W mark + WAAFA wordmark (the supplied cut-outs through next/image until the vector originals arrive;
  never typed, never traced by hand) + the tagline in three lines of
  small caps from 768 px. Header: W 40 px, wordmark 19 px; phone: W 32 px, wordmark 15 px, no tagline; minimum W 28 px
  (PRD), below that the favicon. Clear space ¼ of the W height. Full colour only, on white or mist-50 only: never on navy or
  photos, never recoloured, no white/silver/mono versions (CLAUDE.md, Brand board). The WAAFA logo appears once per page,
  in the header; "Waafas World" is always text in the heading font, never a second mark.
- **Header.** 64 px phone, 72 px desktop. Transparent (no fill, no hairline) at the top of the page over the white hero;
  solid white with backdrop blur and a mist-100 hairline after 24 px of scroll. The home hero puts the headline on white and
  the photo or video in an inset rounded panel below it (the search card overlaps its lower edge), so the logo always sits
  on white. Desktop nav: Home, Tour Packages, Visa
  Services, Waafas World, Gallery, Feedback, More; then a hotline/WhatsApp chip, "Need help?" panel and Log in (P1).
  Between 768 and 1279 px the nav folds into the drawer; from 1280 px it shows in full.
- **Mega panel (Waafas World)** and **More panel**: popover panels on desktop (NavigationMenu), staggered entrance, icon +
  title + one line per item; bottom sheets on phones.
- **Bottom tab bar** (phones, below 768 px): Home, Packages, Waafas World (raised W disc), Visa, More; ribbon pill moves with
  `layoutId`; 64 px tall plus safe-area inset; the WhatsApp button floats above it.
- **Search card.** Glass, radius 28, four tabs, fields 56-64 px tall on phones, Search button 56 px, swap button 40 px circle
  that rotates 180°. Phone pickers are vaul drawers or full-screen sheets; desktop pickers are popovers.
- **Buttons.** Full pills (measured on the Components board). Primary (electric), secondary (white + mist-300 ring),
  soft (electric-50), WhatsApp (green, with the WhatsApp glyph), navy, ghost, danger, white and glass for dark bands.
  Heights 56 / 48 / 38 px, icon buttons 44 px circles. Press scales to 0.975; hover fades a darker overlay
  (opacity only). Loading keeps the width and shows the 18 px spinner. One primary action per view; labels are
  verbs ("Send query", "Add to cart").
- **Inputs.** Label above, 52 px field, 12 px radius, helper text below, error text below in danger with an icon and
  `aria-describedby`; phone input with a country picker (default +880).
- **Cards.** Radius 16, hairline border. Fare card (boarding-pass anatomy, "Indicative" label), package card (cover,
  nights per city, "from ৳ per person, twin sharing", tags), destination tile (photo with a bottom gradient for legibility),
  product card (image on mist-50, brand, title on two lines, price, struck MRP, "Save ৳…", stock badge, Add → stepper,
  "Choose options" for variants), team card (3:4 portrait or initials on the ribbon).
- **Chips and badges.** Chips 32 px pills for filters and recent searches; badges 24 px, radius 7; the premium badge is a
  navy pill with a gold triangle and white text.
- **Feedback states.** Skeletons at the final size with a shimmer; empty states with one line and one action; error states
  that say what happened and how to fix it; toasts via Sonner (3 s, errors persist).
- **Data (admin).** shadcn Data Table, Command (Ctrl+K), Sidebar on midnight, Charts with the five chart tokens.

## 7. Do's and Don'ts

**Do**
- Use real photography only (Unsplash/Pexels with credits until Waafa's own), one cool grade, people and places from the
  routes Waafa sells. Keep the prototype's drawn scenes out of the live site.
- Label every pre-booking price: "Indicative from ৳58,500 per adult", "from ৳ per person, twin sharing".
- Show seats left, stock and countdowns only when staff entered them; show payment marks only for live methods.
- Write plainly from the traveller's side: "Our travel expert will call you", "Send query", "Track order".
- Keep zoom enabled; 44 px minimum targets; visible focus; announced errors; reduced motion respected.

**Don't**
- Show trade licence numbers, owner details, ID numbers or fees; offer Hajj, Umrah, manpower or employment visas.
- Fake availability, urgency or reviews; add review rich results for our own testimonials.
- Recolour, outline, glow or retype the logo; place it on navy or photos; add a second logo beside "Waafas World".
- Use AI-generated, painted or drawn images; emoji as icons; icons in coloured circles; gradient blobs; purple; neon.
- Put an eyebrow above every heading, accent one word of a headline, add SEO filler under headings, or repeat a section
  layout. No em dashes in UI copy (use a comma, colon or full stop). No "elevate", "seamless", "unleash", "discover".
- Stack banners, app prompts or cookie sheets over the search card; block pinch-zoom.

## 8. Responsive behaviour

| Breakpoint | Width | What changes |
| --- | --- | --- |
| base | 320-767 | Top app bar + bottom tab bar, sheets for pickers and filters, single column, 16 px gutters, cards scroll horizontally where the section says so |
| md | 768 | Tagline on, bottom tab bar off, dialogs instead of full-screen sheets, 2-3 column grids, 28 px gutters |
| lg | 1024 | Filter rail beside results, search fields in one row, help card rail |
| xl | 1280 | Full desktop nav, 40 px gutters |
| 2xl | 1440 | Design reference width; container stops at 1320 px |

Touch targets ≥ 44 px (56 px for search fields and the Search button). Hover effects only on `(hover: hover) and
(pointer: fine)`; phones get press feedback. Every multi-column layout declares its phone fallback explicitly.
No horizontal page scroll at any width from 320 px.

## 9. Agent prompt guide

Quick reference: primary #0053D7 · hover #003FBE · heading #00185B · text #0E1424 · secondary #556078 · hairline #E3E8F0 ·
panel #F6F8FB · dark #020D39 · cyan on dark #39CCE9 · gold marker #A8782F · radius 12/16/28 · Plus Jakarta Sans + Inter.

Ready-to-use prompts:
- "Build `<Section>` for WAAFA from `docs/design/project/<Screen>.dc.html` (copy and data) using shadcn primitives in
  `components/ui`, tokens from `globals.css`, MotionKit reveals from `MOTION.md`. Phone first at 390 px. One heading in
  navy, no eyebrow, no accent word. Data from the repository layer only."
- "Make a fare card in the boarding-pass style: large IATA codes, dashed path with the plane, ticket-stub notch, tabular
  times, 'Indicative' badge, seats left only if present, Request this fare button."
- "Review this page against DESIGN.md Do's and Don'ts and the taste skill pre-flight; list violations and fix them."

## Design system files and prototype deviations

- UI UX Pro Max output, reconciled with this file and PRD §16: `docs/design/design-system/waafa/MASTER.md` and page
  overrides in `pages/` (home, flights, shop, admin). This file wins where they differ.
- Signature moments and the competitor beat list: `MOTION.md` §8 and §9.

Every visual deviation from the prototype, with the reason (correction 11: the prototype is the floor, not the ceiling).

| Prototype | Build | Why | Decision |
| --- | --- | --- | --- |
| White and silver logo versions on dark | Full-colour logo on white or mist-50 only; light footer | Never recolour the logo | D9 |
| Header 76 px on desktop | 64 px phone, 72 px desktop | PRD FR-GLB-01 | D10 |
| Mixed button radii | Full pills 48 / 38 / 56 px, icon buttons 44 px | Measured on the Components board; one shape rule | D20 |
| Blur-in hero headline (filter) | Opacity + small rise in CSS | Transform/opacity rule; LCP off the hydration path | D11 |
| Accordion height animation | Fade | Transform/opacity rule | D21 |
| Drawn scenery stand-ins and motion-graphic loops (route map, passport, product animations) | Real photos and real footage; the route map becomes a live SVG | Correction 7: real media only | D37 |
| Store bar with a W mark beside "Waafas World" | One WAAFA logo in the header, "Waafas World" as text | Corrections 2 and 4 | D36 |
| Mobile tab labelled "Shop" | "Waafas World", two lines allowed at 320 px | Correction 3 | D36 |
| "Log in" in the header at launch | Hidden until customer accounts ship (P1) | No dead buttons at launch | A6 |
| Package query in a modal (PackageDetail-query) | Inline section under the questions, reached by Send query from the booking card or the phone bar | One shared request card for every module; deep-linkable; no focus trap on phones (D79) | A11 |
| Plan my trip asks contact last, with a "Your trip so far" summary | Contact first in the shared two-step card; the help card sits beside it | Lead captured early, one flow everywhere (D80); live summary in A22 | A11 |
| Package gallery always shows five tiles | The bento adapts to 1 to 5 photos | Packages with two photos left empty tiles | A11 |

## Known gaps
- Logo vectors: the lockup uses the supplied PNG cut-outs until the original SVG/AI arrives (owner question).
- Photography and footage: Unsplash photos and stand-in loops until Waafa's own; scenery loops need licensed footage (A5).
- Bangla typography (Hind Siliguri) and its line-height adjustments arrive with Bangla in P1.
- Admin dark mode is P1; the admin uses the light tokens with a midnight sidebar at launch.
- Charts palette beyond five series is undefined; admin charts must stay within five.
