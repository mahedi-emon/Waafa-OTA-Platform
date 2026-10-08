# WAAFA — design handoff for the frontend build

This folder pairs with `docs/PRD.md`. The PRD stays the source of truth for behaviour; this handoff tells you **which screen to match** for every route, **which components to use**, the **tokens**, the **build order** and the **rules** the build must keep.

- Prototype: open `../index.html` (every screen works offline; phone screens open in a 390 px frame).
- Screen sources: `../project/*.dc.html` (HTML + a small logic class per screen). Read them for exact copy, states and sample data.
- Tokens and every style: `../project/waafa.css`. A Tailwind v4 version is in `tokens.css` here.
- Full screen list with sizes: `screens.csv`.

## Stack (from the PRD)

| Layer | Choice |
| --- | --- |
| Web | Next.js App Router, React, TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui on Radix, lucide-react, selected 21st.dev components copied in and reviewed |
| Motion | Motion (formerly Framer Motion) through LazyMotion; Embla for carousels |
| Forms and state | React Hook Form + zod, TanStack Query, nuqs for URL search state |
| i18n | next-intl (Bangla in Phase 1B) |
| API | NestJS on Fastify, PostgreSQL + Prisma, Redis + BullMQ |

## Routes and the screens to match

Board names are the file names in `project/` (phone versions end in `-m`). P0 ships on 13 October, P1 within 30 days, P2 with live booking.

| Route | Screens | Build with | Phase |
| --- | --- | --- | --- |
| `/` | Home, Home-t, Home-m, Home-help, Home-m-drawer, Home-m-more, Home-shopmenu | Header, SearchCard, TabBar, Footer, MotionKit, team bento | P0 |
| `/flights` | Flights, Flights-2, Flights-done, Flights-err, Flights-edit, Flights-m-*, Pick-* | Results shell + ManualBody (2-step query form), group fares rail | P0 |
| `/flights` (Live) | FlightsLive, -offer, -loading, -nomatch, -book, -pay, -price, -done, -m-* | LiveBody in the same slot, against fixtures | P2 |
| `/flights/group-fares` | GroupFares, GroupFares-empty, GroupFares-m, -m-empty | Fare cards labelled indicative, Request this fare | P0 |
| `/hotels` | Hotels, Hotels-2, Hotels-done, Hotels-m-*; Live: HotelsLive, -map, -detail, -book, -done, -m-* | Same shell; Live adds list or map, rooms and rate plans | P0 / P2 |
| `/tour-packages`, `/tour-packages/[slug]` | Packages, Packages-empty, PackageDetail, -photos, -query, -done, Packages-m-* | Filter sheet, gallery lightbox, itinerary timeline, sticky booking card | P0 |
| `/plan-my-trip` | PlanTrip, PlanTrip-4, PlanTrip-done, PlanTrip-m-* | Multi-step form | P0 |
| `/visa-services`, `/visa-services/[country]` | Visa, Visa-none, VisaCountry, -medical, VisaApply, -2, -3, -4, -err, -done, -m-* | Country cards, checklist, private document upload | P0 |
| `/visa-guide`, `/visa-guide/[country]` | VisaGuide, VisaGuidePost (+ -m) | Article layout with contents list | P0 |
| `/shop` | Shop, Shop-m, Shop-mega, Shop-suggest, Shop-bulk, Shop-mini | ShopBar, campaign carousel, rows that hide when empty, PCard | P0 |
| `/shop/c/[slug]`, brand, collection | ShopList, -printers, -empty, -m, -m-filters, -m-fashion, ShopCats, ShopDeals | Attribute filters from the category set, sort, Load more | P0 |
| `/shop/p/[slug]` | ShopProduct, -pb, -hp, -toner, -video, -bulk, -m-* | Variant selector updates price, stock, SKU and images | P0 |
| `/shop/finder`, `/shop/search` | ShopFinder, -part, -none, ShopSearch | Brand → model → products, part-code search | P0 |
| `/shop/cart` → checkout → order | ShopCart, -empty, -coupon, ShopCheckout, -err, ShopDone, -bank, ShopTrack, -nf, -delivered | COD cap, offline payment with proof upload, ORD- numbers | P0 |
| Printing Solutions, International Trading | Printing, Printing-done, Trading, Trading-done (+ -m) | Quote form (PRN-), RFQ form (TRD-) | P0 |
| `/gallery`, `/feedback` | Gallery, Gallery-album, Gallery-photo, Feedback, Feedback-sent | Masonry grid, lightbox, moderated wall | P0 |
| More pages | About, Contact, Faqs, Blog, BlogPost, Refund, Privacy, Terms, Baggage, Emi, OfflinePay (+ -m, -sent) | Rich text from Admin, FAQPage markup | P0 |
| `/track`, `/login`, `/account` | Track, Track-nf, Login, Login-otp, Login-err, Account | Phone OTP sign-in | P1 |
| 404, 500, offline, maintenance | Error, Error500, Offline, Maintenance, States | Shared empty, error and loading patterns | P0 |
| `/admin/*` | Admin* (52 screens) | shadcn Sidebar, Data Table, Command, Charts; never indexed | P0 |

## Components: shadcn/ui first, 21st.dev where it adds polish

Install shadcn/ui components with the CLI into `components/ui`. Copy 21st.dev components into `components/fx`, review them for accessibility and bundle size, and restyle them with the tokens.

| Piece | shadcn/ui and libraries | 21st.dev reference | Notes |
| --- | --- | --- | --- |
| Header, More menu, Waafas World panel | NavigationMenu, DropdownMenu, Sheet | Mega Menu | Logo is never recoloured. The WAAFA logo appears once, in the main header; the Waafas World name in the store bar, mega menu, Home band and emails is text only (no second mark) |
| Bottom tab bar | Custom nav, Motion layoutId pill | — | Tabs: Home, Packages, **Waafas World** (raised W disc), Visa, More |
| Search card and pickers | Tabs, Popover, Command, Calendar (range), Drawer (vaul) | — | Phones: full-screen pickers; desktop: popovers |
| Travellers and quantity | Popover + button group | Quantity Stepper (#29940) | Infants ≤ adults |
| Forms | Form (react-hook-form + zod), Input, Select, RadioGroup, Checkbox, Switch, Textarea | OTP Input | One zod schema with the API; Turnstile on submit |
| Filters and price range | Accordion, Checkbox, Slider, Sheet on phones | Price Range Slider | Filters live in the URL (nuqs) |
| Cards: offers, packages, hotels, products | Card, Badge, Button, Tooltip, AspectRatio | Add to Cart Button (#34564) | Add turns into a stepper; Choose options for variants |
| Carousels and gallery | Carousel (Embla), Dialog | Carousel, Masonry Lightbox | Swipe, keyboard, captions |
| Numbers, logos, countdowns | — | Number Ticker, Logo Marquee, Countdown | Stop under reduced motion |
| Order and visa tracking | Card, Separator | Order tracking, Milestone Timeline | Statuses from the PRD |
| Dialogs, drawers, toasts, skeletons | Dialog, AlertDialog, Sheet, Sonner, Skeleton | — | Price-change dialog is an AlertDialog |
| Admin shell and search | Sidebar block, Command (cmdk), Breadcrumb | Command Palette | Ctrl K |
| Admin tables and charts | Data Table (TanStack Table), Chart (Recharts), Pagination | Dashboard layouts | Row selection, bulk bar, CSV export |
| Admin board and category tree | dnd-kit | Kanban, Tree View | Board is P1; tree nests three levels |
| Rich text and uploads | Tiptap, react-dropzone | — | Alt text required; R2 signed uploads, private bucket for passports |

## Motion

| Pattern | Timing | Build |
| --- | --- | --- |
| Page enter | 420 ms, ease-out, opacity + 8 px | `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}` in the layout template |
| Scroll reveal | 560 ms, 60 ms stagger, once | `whileInView` + `viewport={{ once: true, margin: "-6%" }}` |
| Tab pill | spring 500 / 38 | `layoutId="tab-pill"` |
| Add to cart | 300 ms spring, badge pop | AnimatePresence + 21st.dev Add to Cart Button |
| Skeleton → content | 1.4 s shimmer, 300 ms fade | shadcn Skeleton, same height as the content |
| Sheets and drawers | spring 380 / 34 | vaul Drawer on phones, Sheet on desktop |
| Toasts | 350 ms, 3 s | Sonner |
| Success check | 700 + 450 ms stroke draw | `pathLength` 0 → 1 |
| Hold timer | 1 s ticks, red under 2 min | `scaleX = secondsLeft / 900` |

Reduced motion: rise, slide and spring become a 150 ms fade; marquee and Ken Burns stop; counters show the final number. Animate only transform and opacity.

### Effects from 21st.dev (install with your own key)

Each effect in the prototype copies one 21st.dev component, restyled with the WAAFA tokens. Install with
`npx shadcn@latest add "https://21st.dev/r/<author>/<component>?api_key=$API_KEY_21ST"`, put it in `components/fx`,
and check keyboard use, reduced motion and bundle size before shipping. The full table is on the Motion board.

| Effect | 21st.dev component (id) | Where |
| --- | --- | --- |
| Video hero with word reveal | rahil1202/prisma-hero (12200) | Home hero |
| Soft blur-in headline | educalvolpz/soft-blur-in (19835) | Hero and page titles |
| Rotating destination chip | danielpetho/text-rotate (657) | Home hero |
| Border beam | gooseui/border-beam (18473) | Search card |
| Shimmer button | dillionverma/shimmer-button (833) | WhatsApp and quote buttons |
| Spotlight card | preetsuthar17/spotlight-card (2220) | Offers, visa and package cards |
| 3D tilt card | tom_ui/tilt-card (12245) | Destinations, package grid |
| Number ticker | dillionverma/number-ticker (1282) | About stats, admin KPIs |
| Logo marquee | ddoemonn/logo-marquee (23537) | Airlines row |
| Route map | manuarora700/world-map (999) | About, admin sign-in |
| Hover to preview | ruixen.ui/hover-play-card (7487) | Package cards |
| Product video player | reuno-ui/skiper67 (28516) | Store product video |
| Runway loader | aicanvas/runway-loader (26534) | Live flights loading |
| Confetti | dillionverma/confetti (843) | Success screens |
| Add to cart | bidyut10/add-to-cart-button (34564) | Product cards and page |
| Order tracking | ravikatiyar162/order-status-tracker (8205) | Order and visa tracking |
| Timeline | manuarora700/timeline (857) | Package itinerary |
| Masonry lightbox | ayushmxxn/masonry-lightbox (26223) | Gallery |
| Upload dropzone | cult-ui/halo-dropzone (34883) | Visa documents, payment proof |
| Stepper | shadcnspace/stepper-03 (28558) | Visa apply, checkout |

### Images and video in the prototype

- Every photo slot shows an original drawn scene as a **prototype stand-in**, because the design canvas can't load external photos. The PRD rule stands for the live site: real photos only (Unsplash or Pexels until Waafa's own arrive), never AI-generated, painted or drawn scenes. Slots are keyed by `data-photo`; `photos.css` and `photos/get-waafa-photos.mjs` in this package swap in the real photos.
- Twelve short loops (H.264 MP4 + VP9 WebM, 1280×720, 0.1–0.9 MB, poster frame each). The route map, passport and product videos are motion graphics the site can use. The scenery loops (clouds, lagoon, balloons, port, printer, city) are stand-ins: use real footage with a free licence (Pexels or Coverr) at the same size for the live site.
- Markup: `<video autoPlay muted loop playsInline poster="…"><source type="video/webm"><source type="video/mp4"></video>`, started only when visible (IntersectionObserver), poster only under reduced motion.

## Build order to the 13 October launch

1. **Thu 8 – Fri 9 Oct · foundation** — monorepo, Next.js, Tailwind tokens, fonts, shadcn init; layout shell (Header, Footer, TabBar, MotionKit, breadcrumbs); Home with static data.
2. **Sat 10 Oct · search and Manual mode** — SearchCard and pickers; one results shell; Manual query forms for flights and hotels; group fares; success pages; `POST /leads` with an idempotency key.
3. **Sun 11 Oct · packages, visa, content** — packages and detail, Plan my trip, visa list/country/apply/track, Visa Guide; Gallery, Feedback, About, Contact, FAQs, Blog and policies.
4. **Mon 12 Oct · Waafas World and Admin** — store home, listing, product with variants, cart, checkout (COD and offline), order success and tracking, Find by model, printing and trading forms; Admin sign-in, leads, booking modes, catalogue, orders, content. Staging sign-off.
5. **Tue 13 Oct · launch** — SEO and sitemap, GA4 and Pixel after consent, Lighthouse CI, Playwright smoke tests on phone sizes, go live. Then P1 (accounts, online payment, Bangla) and P2 (Live bodies against fixtures).

## Kick-off prompt for Claude Code

```
Read docs/PRD.md and docs/design/handoff/HANDOFF.md.
Build apps/web with Next.js App Router, TypeScript strict, Tailwind v4 and
shadcn/ui. Take tokens from docs/design/handoff/tokens.css into
app/globals.css. Start with the layout shell (Header, Footer, TabBar,
MotionKit) and Home. For every route, open the listed screens in
docs/design/index.html and docs/design/project/, and match them on a 390 px
phone first, then 768 and 1440. Use real components, not screenshots. Keep
sample data in /fixtures, marked Sample. Ask before adding a dependency that
is not in the PRD.
```
## Rules the build must keep

Never:
- show trade licence numbers, owner details, ID numbers or fees on the site, in seed data or in the repository;
- offer Hajj or Umrah packages, or manpower, recruitment or employment-visa services;
- fake live availability — Manual mode fares are indicative and confirmed by an expert before payment;
- invent reviews or testimonials — the feedback wall shows approved submissions only;
- make passport or visa documents public — private bucket, signed and logged links;
- list restricted items in Waafas World.

Always:
- keep every page usable on a 320 px phone with the bottom tab bar; the tab label is **Waafas World** and the route is `/shop`;
- show the WAAFA logo once per page (main header); write "Waafas World" as text next to it, never with a second logo;
- show prices in taka with VAT included, ৳ sign and Indian grouping (1,46,480); show online payment only when it is live;
- use photos from Unsplash with credits (Photo brief) or Waafa's own product shots;
- turn movement into short fades under reduced motion;
- protect form submits with Turnstile, rate limits and an idempotency key;
- write every admin change to the audit log with before and after values.
