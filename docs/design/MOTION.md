# WAAFA motion system

Motion that explains, never decorates. Every animation answers one of four questions: **what matters here**
(hierarchy), **what happens next** (story), **did that work** (feedback) or **what changed** (state). If an effect
answers none of them, it does not ship.

Sources: PRD §16 (motion principles), HANDOFF.md (Motion and 21st.dev tables), the prototype boards `Motion`,
`MotionKit` and `Tokens`, and the competitor pass in `COMPETITOR_BENCHMARK.md`. Code lives in
`apps/web/src/components/motion` (MotionKit) and `apps/web/src/components/fx` (21st.dev effects, restyled).

## 1. Tokens

One set of values for CSS and for Motion. CSS variables live in `globals.css`; the same numbers are exported from
`components/motion/tokens.ts` so Tailwind classes and `motion/react` stay in step.

### Durations
| Token | CSS variable | Value | Use |
| --- | --- | --- | --- |
| fast | `--dur-fast` | 150 ms | hover, press, colour, focus, every reduced-motion fade |
| base | `--dur-base` | 220 ms | chips, toggles, small moves, tooltip |
| slow | `--dur-slow` | 300 ms | popovers, dialogs, drawers fading, card lift, skeleton cross-fade |
| enter | `--dur-enter` | 420 ms (page) · 560 ms (reveal) | page enter, section reveals; never above 700 ms |
| long | — | 700-1,200 ms | one-off moments only: success check (700 + 450 ms), loader (≤ 1.2 s), counters (900 ms) |
| loop | — | 7 s beam · 40 s marquee · 18 s Ken Burns | ambient loops, desktop only, stop under reduced motion |

### Easing
| Token | CSS variable | Value | Use |
| --- | --- | --- | --- |
| out | `--ease-out` | `cubic-bezier(.22, 1, .36, 1)` | things arriving: reveals, page enter, image zoom, lifts |
| in-out | `--ease-in-out` | `cubic-bezier(.65, 0, .35, 1)` | things moving across: sheen, loader strokes |
| standard | `--ease-standard` | `cubic-bezier(.2, 0, 0, 1)` | state changes: colour, size of indicators |
| spring (CSS) | `--ease-spring` | `cubic-bezier(.34, 1.36, .64, 1)` | small pops: badge, check mark, chip select |
| exit | — | `cubic-bezier(.4, 0, 1, 1)`, 70 % of the enter time | things leaving (exits are always faster than entrances) |

### Springs (Motion)
| Name | Values | Equivalent | Use |
| --- | --- | --- | --- |
| `spring.tab` | stiffness 500, damping 38 | visualDuration .35, bounce .18 | tab pills (search, sort, TabBar), segmented controls, 180° swap |
| `spring.sheet` | stiffness 380, damping 34 | visualDuration .42, bounce .08 | bottom sheets, drawers, mini-cart |
| `spring.lift` | stiffness 300, damping 24 | visualDuration .30, bounce .15 | card lift, tilt return, press release |
| `spring.pop` | stiffness 600, damping 22 | visualDuration .25, bounce .35 | cart badge pop, toast in |

### Choreography
- **Stagger:** 50 ms between items (40-60 ms), at most 8 items animate; the rest appear with the 8th.
- **Reveal:** rise 16 px + fade, 560 ms, `--ease-out`, once, viewport margin `0px 0px -6% 0px`.
- **Page enter:** fade + 8 px rise, 420 ms, only on client-side navigation (never on the first load).
- **Order:** container first, then its content; the primary action settles last so the eye ends on it.

## 2. Effect catalogue

Build column: **MK** = MotionKit primitive in `components/motion`; **fx** = 21st.dev component in `components/fx`
(id from HANDOFF), rebuilt with our tokens; **CSS** = keyframes or transitions in `globals.css`, no JavaScript.
"Desktop" means `(hover: hover) and (pointer: fine)` and a viewport of at least 1024 px.

### Global and navigation
| Effect | Where | Timing | Build | Phone / desktop | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Page enter | every route change (`template.tsx`) | 420 ms out, opacity + 8 px | MK `PageTransition` | both | 150 ms fade |
| Brand loader | route changes slower than 300 ms | W ribbon strokes draw ≤ 1.2 s, then the mark fades in | MK `DrawCheck`-style SVG stroke | both | static mark |
| Header solidify | sticky header | 0-24 px of scroll | CSS scroll-driven `animation-timeline: scroll()` on a background layer's opacity; IntersectionObserver sentinel fallback | both | instant swap |
| Mega and More panels | desktop nav | panel 220 ms fade + 6 px; items stagger 30 ms | Radix NavigationMenu + MK `Stagger` | desktop | 150 ms fade, no stagger |
| TabBar pill | phone bottom bar | spring.tab | `layoutId="tabbar-pill"` | phone | instant |
| Drawer and sheets | menu drawer, More sheet, pickers, filters | spring.sheet, drag to close | vaul `Drawer` (phone), shadcn `Sheet` (desktop) | both | 150 ms fade |
| Breadcrumb, skip link | every page | none | — | — | — |
| Floating WhatsApp | above TabBar | enters 300 ms after first paint, 220 ms rise | CSS | both | appears without movement |

### Home hero and search
| Effect | Where | Timing | Build | Phone / desktop | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Headline word reveal | home hero `h1`, page titles | words rise 0.35 em + fade, 60 ms apart, 500 ms each | **CSS keyframes** (`--i` per word) so it never waits for hydration; based on fx Soft Blur In (19835) without the blur | both | words visible at once |
| Rotating destination chip | hero meta | every 3 s, outgoing rises out, incoming rises in (opacity + y) | fx Text Rotate (657) | both | first destination only, no rotation |
| Hero media | hero panel | muted loop, plays when visible; poster is the LCP image | MK `SmartVideo` | phone: poster only on Save-Data or 2G/3G | poster only |
| Ribbon parallax | hero ribbon underlay | translateY at 0.15× scroll | MK `Parallax` (`useScroll` + `useTransform`) | desktop | static |
| Border beam | search card | a light runs round the border every 7 s | fx Border Beam (18473) as a rotating conic layer masked to the border (transform only) | desktop | off |
| Search tabs | search card | spring.tab pill | `layoutId="search-tab-pill"` | both | instant |
| From/To swap | flight tab | 180° rotate of the button, fields cross-fade 150 ms | MK `PressScale` + Motion rotate | both | no rotation, instant swap |
| Picker open | phone | spring.sheet bottom sheet or full-screen sheet | vaul `Drawer` | phone | 150 ms fade |
| Picker open | desktop | 180 ms fade + 4 px scale from 0.98 | Radix Popover | desktop | 150 ms fade |
| Date range fill | date picker | selected range fills left to right, 220 ms | CSS transform `scaleX` on the range layer | both | instant |
| Traveller stepper | travellers sheet | number rolls up/down 220 ms (old out, new in, y ±8 px) | MK `CountUp` (roll mode) | both | number swaps |
| Validation error | any field | 6 px shake once, 400 ms, then helper text | Motion `x: [0,-6,6,-4,4,0]` | both | no shake, colour + text only |
| Search button sheen | primary search and quote CTAs | sheen crosses every 4.6 s, never while pressed | fx Shimmer Button (833), transform on a gradient overlay | desktop | off |

### Lists and cards
| Effect | Where | Timing | Build | Phone / desktop | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Scroll reveal | section headings, card rows, grids | reveal tokens, once | MK `Reveal` + `Stagger` | both | 150 ms fade |
| Card lift + image zoom | packages, hotels, products, offers | lift 4-6 px (spring.lift), image scale 1.04 over 600 ms | Tailwind `group-hover` transforms | desktop | none |
| Press scale | any tappable card or button | scale 0.98 for 100 ms | MK `PressScale` / `active:scale-[.98]` | phone | none |
| Spotlight | offer, visa and package cards | soft light follows the pointer, 350 ms fade in | fx Spotlight Card (2220) as a radial-gradient layer moved with `translate3d` (no background-position repaint) | desktop | off |
| Tilt | destinations, team cards | up to 6° toward the pointer (prototype 9°, reduced for calm) | fx Tilt Card (12245) via `useMotionValue` + `useTransform` | desktop | off |
| Hover preview | package cards with a loop | plays muted on hover, 450 ms fade | fx HoverPlayCard (7487) | desktop | poster only |
| Filter change | package list, store listing | items re-flow with `layout`, 300 ms; new items fade in | Motion `layout` + `AnimatePresence mode="popLayout"` | both | instant |
| Shared image card → detail | package and product cards | image morphs into the detail hero | View Transitions API where supported (`viewTransitionName`), else page enter | both | page enter fade |
| Carousel | offers, packages on phones | Embla drag with momentum; dots move with spring.tab | Embla + MK | both | Embla `duration` 0 (jump) |
| Airline / brand marquee | home airlines, top brands | 40 s loop, pauses on hover and focus | MK `Marquee` (CSS transform, duplicated track) | both | static row, scrollable |
| Ken Burns | package detail hero | scale 1.02 → 1.08 over 18 s, mirrored | CSS keyframes | desktop | static |

### Feedback and states
| Effect | Where | Timing | Build | Phone / desktop | Reduced motion |
| --- | --- | --- | --- | --- | --- |
| Skeleton shimmer | listings, results, admin tables | 1.4 s highlight sweep (translateX of a gradient overlay) | shadcn `Skeleton` restyled | both | static grey |
| Skeleton → content | same | 300 ms cross-fade; skeleton has the content's exact height | MK `Reveal` (fade only) | both | instant |
| Toast | confirmations, errors | in 350 ms spring.pop from the edge, out 200 ms; 3 s (errors stay) | Sonner via shadcn | both | fade |
| Add to cart | product cards and page | Add morphs into a stepper (spring.lift); thumbnail flies to the cart (500 ms arc, transform only); badge pops (spring.pop) | fx Add to Cart Button (34564) + MK | both | stepper appears, badge updates, no flight |
| Mini-cart | after add | spring.sheet from the right (desktop) or bottom (phone) | shadcn `Sheet` / vaul | both | fade |
| Success check | every success screen | circle draws 700 ms, tick 450 ms | MK `DrawCheck` (SVG `pathLength`) | both | drawn instantly |
| Confetti | lead sent, order placed, visa file sent | one burst, 2.8 s, brand colours, never repeats on a page | fx Confetti (843), canvas | both | off |
| Count up | About numbers, admin KPIs | 900 ms out once in view; owner-provided numbers only | MK `CountUp` (fx Number Ticker 1282) | both | final number |
| Countdown | deals with an end date (store) | flips each second | fx Flip Countdown (3809) | both | static text |
| Stepper progress | visa apply, checkout, Plan My Trip | bar `scaleX` 300 ms; step content slides 16 px | fx Stepper (28558) | both | fade |
| Upload | visa documents, payment proof | drop halo 220 ms; progress `scaleX` | fx Halo Dropzone (34883) | both | no halo |
| Order / visa tracking | track pages | completed segments fill with `scaleX` 600 ms, staggered | fx Order Status Tracker (8205) | both | filled |
| Itinerary | package detail | progress line `scaleY` follows scroll | fx Timeline (857) with `useScroll` | both | static line |
| Gallery lightbox | gallery, package photos | open with a 300 ms scale-from-thumbnail, swipe between | fx Masonry Lightbox (26223) + Embla | both | fade |
| Hold timer (Live, P2) | booking | bar `scaleX = secondsLeft / 900`, 1 s ticks, red under 2 min | MK | both | numbers only |
| Runway loader (Live, P2) | live flight loading | plane taxis and takes off at 100 %, 3.4 s | fx Runway Loader (26534) | both | progress text |

### Admin
Sidebar collapse 220 ms; Command palette 180 ms fade + scale 0.98 → 1; table row updates highlight with an opacity
flash (no colour animation); charts fade and rise as a block (Recharts internal animation off, so charts follow the
transform/opacity rule); drag and drop (dnd-kit) uses transforms with `spring.lift`.

## 3. Phone vs desktop

- **Phones** (`pointer: coarse` or < 1024 px): feedback motion only (press scale, sheets, pills, steppers, success
  states, reveals). No hover effects, no parallax, no spotlight, no tilt, no border beam, no sheen, no Ken Burns.
  Video hero plays only on good connections; otherwise the poster.
- **Desktop** (`hover: hover` and `pointer: fine`): adds lift, image zoom, spotlight, tilt, hover preview, border beam,
  sheen, ribbon parallax. Each runs on one element at a time (the hovered one).
- **Never on either:** scroll hijacking, custom cursors, autoplaying carousels that move content under a finger,
  more than one marquee per page, infinite loops in the content area except the hero media and the marquee.

## 4. Reduced motion

Respect `prefers-reduced-motion: reduce` first (and `Save-Data` for video):
- Rise, slide, scale and spring become a **150 ms fade** (`MotionConfig reducedMotion="user"` plus
  `useReducedMotion()` in MotionKit; the CSS reset in `globals.css` caps CSS animations and transitions at 150 ms).
- Marquee, Ken Burns, border beam, sheen, text rotate and confetti stop; videos show their poster; counters show the
  final number; the loader shows the static mark; the success check appears already drawn.
- Nothing moves on its own. Content order and information never depend on an animation finishing.

## 5. Performance rules

1. **Transform and opacity only.** No animating width, height, top, left, margin, colour, background-position, filter
   or box-shadow. Shadows change by fading a pre-rendered shadow layer's opacity. Hover colours either swap instantly
   or fade an overlay layer's opacity (buttons use a `::before` overlay inside an isolated stacking context).
   The accordion opens at full height and fades its text in (no height animation). Exceptions: SVG stroke draws on
   small icons (loader, success check, ribbon edge), and the confetti canvas.
2. **Above the fold never waits for JavaScript.** Hero motion (word reveal, chip, media fade) is CSS; the LCP element
   (hero poster or headline) is visible in the server HTML. Never server-render `opacity: 0` on above-the-fold content,
   and never put `Reveal` on it. `PageTransition` skips the first load.
3. **Visible without JavaScript and in print.** Reveal targets carry `data-reveal`; `<noscript>` and `@media print` rules
   force them visible.
4. **Motion is small and lazy.** `LazyMotion` with `domAnimation` (strict, `m.*` components only). Effects that need
   pointer physics or drag load only on desktop with `next/dynamic` (`ssr: false`). Confetti, lightbox and the runway
   loader load on demand.
5. **No scroll listeners.** Use `useScroll`, IntersectionObserver or CSS scroll-driven animations; never
   `window.addEventListener('scroll')` or `useState` for continuous values (use motion values).
6. **Frame budget.** No long task over 50 ms while animating; no animation callback over 16 ms; INP ≤ 200 ms on a
   mid-range Android (Lighthouse 4× CPU). `will-change` only while an element is animating.
7. **No layout shift.** Animated elements reserve their final space; skeletons match content height; images and videos
   carry width, height or aspect ratio.

## 6. How to verify an animated interaction

1. Playwright MCP at 390 and 1440: record a trace while the interaction runs; check that no long task exceeds 50 ms
   and that only `transform`/`opacity` style changes occur in the animation frames.
2. Emulate `prefers-reduced-motion: reduce` and repeat: the interaction must still make sense with fades only.
3. Lighthouse mobile on the route: LCP, TBT and CLS within budget (CLAUDE.md Quality gates).
4. Keyboard: every animated control works with Tab, Enter, Space, Esc and arrows, and focus is never lost behind a
   moving element.

## 7. Changes from the prototype

| Prototype | Build | Why |
| --- | --- | --- |
| Soft blur-in (`filter: blur(12px)` → 0) | Opacity + 0.35 em rise, CSS keyframes | Filter animation breaks the transform/opacity rule and costs paint on Android; CSS keeps the hero off the hydration path |
| Spotlight via `radial-gradient(at var(--mx) var(--my))` | Static radial layer moved with `translate3d` | Background repaint on every pointer move otherwise |
| Skeleton `background-position` shimmer | `translateX` of a gradient overlay | Compositor-only |
| Tilt up to 9° | Up to 6° | Calmer; less motion sickness risk on large cards |
| Chart grow (Recharts internal) | Block fade + rise, internal animation off | Transform/opacity rule in admin too |
| Header state via CSS `animation-timeline` on background colour | Same timeline on a background layer's opacity | Transform/opacity rule; same zero-JS behaviour |

## 8. Signature moments

Seven moments no competitor has. Each is built once in MotionKit (`components/motion`) and reused; each answers
"what happens next" or "did that work". All of them respect the rules in sections 4 and 5: transform and opacity
(plus `pathLength` / `stroke-dashoffset` on small SVGs), nothing on the LCP element's first paint, and a defined
end state under reduced motion.

| Moment | Where | Trigger | Motion | Phone / desktop | Reduced motion | MotionKit |
| --- | --- | --- | --- | --- | --- | --- |
| Flight path | Home hero (A7) | first paint, 300 ms after load, once per session | a 1.5 px sky-500 path draws from the end of the headline to the search card, 1,200 ms `--ease-out`; a 6 px dot rides the last 20 % and settles on the card edge | phone: short vertical arc above the card; desktop: wide S-curve | path fully drawn, no dot travel | `FlightPath` (server SVG + CSS keyframes, no JS) |
| Search → results | search card (A8) → `/flights`, `/hotels` (A9, A10) | submit | the card's trip summary (route codes, dates, travellers) becomes the results summary bar: shared element via React `<ViewTransition>` when the installed Next.js/React expose it, else Motion `layoutId="trip-summary"` inside the persistent layout; `spring.sheet` | both | 150 ms cross-fade, no movement | `TripSummaryMorph` |
| Route arc | flight query page (A9) | page enters (after the morph settles) | arc DAC → DXB draws with `pathLength` 0 → 1, 900 ms; a 16 px plane glides along it with CSS `offset-path` + `offset-distance`, 1,600 ms `--ease-in-out`, then rests at the destination | phone: 160 px arc; desktop: 320 px arc | arc drawn, plane at the destination | `RouteArc` |
| Boarding-pass success | every success state: flights, hotels, packages, Plan My Trip, visa, orders, contact, feedback | successful submit | a boarding-pass card rises 24 px out of a clipped "slot", `spring.lift`; the reference number sits in tabular figures; `DrawCheck` draws (700 + 450 ms); a light confetti burst (max 24 pieces, transform + opacity, 900 ms) | confetti skipped on phones with Save-Data | card and check shown in place with a 150 ms fade; no confetti | `BoardingPassSuccess` (+ `DrawCheck`, `Confetti`) |
| Visa checklist | visa apply (A12) | a document is added or removed | the requirement's check draws (350 ms); a 40 px progress ring fills to done / total with `spring.lift`; the count rolls | both | check and ring jump to state, 150 ms fade | `ChecklistProgress` |
| Store add to cart | product cards and page (A13), cart (A14) | Add to cart | a 48 px ghost of the product image flies to the cart icon along an arc (x linear, y ease-in, 600 ms); the badge pops with `spring.pop`; variant swatch ring slides between swatches (`layoutId="swatch-ring"`); product image cross-fades on variant change (240 ms) | phone: arc to the tab bar's Waafas World disc; desktop: to the header cart | no flight; badge updates with a 150 ms fade; toast confirms | `FlyToCart`, `SwatchGroup` |
| Magnetic primary buttons | primary CTAs (Search, Send query, Place order) | pointer within the button | pulls up to 6 px toward the pointer with `spring.lift`; returns on leave | desktop only (`(hover: hover) and (pointer: fine)`) | off | `Magnetic` |

**Loading Motion features.** `MotionProvider` loads `domAnimation` (animations, variants, exit, tap, hover, in-view).
Components that need `layoutId` or drag (TabBar pill, search tabs, swatches, sheets with drag, the trip-summary
morph) wrap their subtree in a nested `LazyMotion` whose `features` is an async import of `domMax`, so the extra
~15 KB loads only on pages that use them.

## 9. Beat list

Every competitor effect recorded in `COMPETITOR_BENCHMARK.md` §2.6, the Waafa effect that replaces it, and why it is
better. "Better" means it explains more, costs less (CLS, LCP, main thread) and works under reduced motion.

| Competitor effect | Waafa replacement | Why it is better |
| --- | --- | --- |
| GoZayaan: spinner and fades while results load | Skeleton rows at the final height, cross-faded in, with one plain line ("Checking fares with our team") | No layout shift; says what is happening instead of spinning |
| GoZayaan: results progress bar | Route arc with the gliding plane on the flight query page | Shows the trip the visitor asked for, not a generic bar; ends in a resting state |
| GoZayaan: header turns solid on scroll | Same idea, done with a CSS scroll-driven layer (IntersectionObserver fallback), blur after 24 px | No scroll listener on the main thread; no CLS |
| ShareTrip: carousels with dot pagination and late banners (CLS 0.93) | Embla carousels with reserved aspect ratios, swipe and keyboard, visible next-card peek | Space reserved up front (CLS ≤ 0.1); peek tells phones there is more without dots |
| ShareTrip: no motion on the home page | Purposeful reveals once, 40–60 ms stagger, hero flight path | Hierarchy and story without decoration; stops under reduced motion |
| Akij Air: split-flap airport board in the hero | Hero flight-path line plus a rotating destination chip | Calm, CSS-only, never delays LCP; the board's flicker is replaced by one drawn line |
| Akij Air: airline marquee on a dark band | "Airlines we book" marquee on a light band, pauses on hover, focus and reduced motion | Readable logos, labelled honestly ("we book", never "partners"), accessible |
| Akij Air: scroll-to-top button with a progress ring | No scroll-to-top (the tab bar and header stay reachable); the progress ring moves to the visa checklist | Progress shown where it means something: the visitor's own file |
| Akij Air: cookie sheet covering the search on a 390 px phone | Compact consent bar above the tab bar, never over the search button | The first screen's job (search) is never blocked |
| Obokash: static carousels, no motion | Same carousels with peek, swipe and press feedback; spring sheets on phones | Feels native on Android; every tap is acknowledged |
| All four: no visible reduced-motion handling | Every effect has a reduced-motion end state (section 4) | Comfortable for motion-sensitive visitors; nothing important hides behind animation |
