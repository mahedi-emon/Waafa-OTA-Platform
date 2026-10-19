# WAAFA Admin: design system and redesign plan (D0)

Epic #201 · written in R0 (#190), 19 Oct 2026 · applies to `/secure-admin-control` and the API it needs.

This document is the floor for every admin screen. It **supersedes the old Admin boards**
(`docs/design/project/Admin*.dc.html`, logged in `DESIGN.md`). `docs/PRD.md` still wins on scope, roles and compliance;
this file wins on admin layout, labels and behaviour. The public site's design, bundles and budgets do not change.

Why: owner feedback, 19 Oct 2026. The admin is confusing and looks bad; staff cannot tell what a screen does or control
the website section by section. Editors are raw data forms, statuses are manual dropdowns, images are a "Src" text box,
tables are hard to read and the sidebar is a long flat list. Goal: **a first-time staff member understands every screen
at a glance and finishes common jobs without help**, with the clarity of Shopify admin, Linear and Stripe Dashboard, in
WAAFA's brand and simpler than them for our jobs.

---

## 1. Principles (every screen, every PR)

1. **Plain words.** Everyday labels ("Cover photo", "Price from", "Show on website") and one line of help under the
   fields that need it. Never an internal name on screen: no ID, slug, src, JSON, key or enum value. Bangla UI arrives
   with the P1 Bangla work; every string already lives in next-intl messages.
2. **Three questions.** Every screen answers *what is this*, *what needs my attention* and *what can I do next*. The page
   header is always title + one-line explanation + one primary action.
3. **One pattern per job.** Lists use the DataTable. Editing uses the sectioned editor with a sticky action bar and a
   right rail (status, visibility, preview, SEO snippet). Work items (leads, visa applications, orders, payment proofs,
   feedback) use the inbox: a list, a detail panel with action buttons, and a timeline.
4. **No manual workflow statuses.** Actions and dates set them (section 8). Every status chip has an icon, a word and a
   colour, and a tooltip that says why it has that status.
5. **Nothing typed that the system knows.** IDs, links (slugs), creation dates, image sizes, popularity and sort numbers
   are automatic. References are searchable pickers with thumbnails, never ID fields. Ordering is drag and drop (with
   Move up and Move down for keyboards and phones).
6. **Safe by default.** Unsaved-changes guard, autosaved drafts, Ctrl/Cmd+S, Undo toasts, a confirm only for destructive
   actions, and a publish checklist that says exactly what is missing. After publishing: a "Live on the site" toast with
   a View link.
7. **Calm, premium, light.** Midnight-950 sidebar (decision in section 2), white work surface on mist-50, Inter 14–15 px
   in tables and 16 px in forms, tabular figures for money and dates, an 8 px spacing grid, roomy forms, dense but
   legible tables, 150–200 ms motion, WCAG 2.2 AA, 44 px touch targets on phones, reduced motion respected.
8. **Right device for the job.** Inbox jobs (leads, visa, orders, proofs, feedback) work fully on a 390 px phone.
   Editors are best from 1024 px and still usable at 768 px (and readable at 390 px).

---

## 2. What the mandatory tools decided

| Tool | What it produced | What we decided |
| --- | --- | --- |
| **ui-ux-pro-max** `--design-system --persist -p "WAAFA Admin"` and `--page` dashboard, list-table, editor-form, media-library, inbox | `docs/design/design-system/waafa-admin/MASTER.md` and `pages/*.md` (reconciled by hand, see MASTER.md) | **Kept:** Minimalism & Swiss Style (clean, functional, grid-based, high contrast); data views at high density with a 12-column grid and full width; subtle hover 200–250 ms; animate one or two key elements per view; never break Back; hover tooltips and row highlight; skeletons for loading. UX rules applied: labels on every input, inline validation on blur, loading → success/error feedback on every submit, error messages with a next step, bulk actions with a checkbox column and an action bar, tables become cards on phones, breadcrumbs for 3+ levels, keyboard order = visual order. shadcn stack rules: Sidebar inside a SidebarProvider at layout level, DataTable pattern for sort/filter/pagination, Command for the palette with grouped headings, Sheet for side content (explicit side), sonner semantic toasts. Executive-dashboard rule: 4–6 KPI cards with trend sparklines. **Rejected:** "App Store landing" pattern, sky-blue + orange palette and Fira fonts (PRD §16 brand colours and Inter + Plus Jakarta Sans win, D6). |
| **design-superpowers** (creative: Refresh Strategist and Layout Strategist; design-review on every finished screen; ds-make and ds-manage for the admin component set) | Maturity L2 (tokens in `globals.css`, DESIGN.md, MotionKit). Keep / evolve / retire table below; composition = sidebar + main with list-detail for work items | **Depth: Evolution** (component-level restyling, new density and status grammar, no new brand). Keep: brand palette, PJS headings, Inter UI, pill buttons, midnight sidebar, mist neutrals, rounded cards. Evolve: page header pattern, card density (24 → 16/20 px padding in data views), table type 14–15 px, status chips (icon + word + colour), form sections with titles and help. Retire: raw schema forms (craft failure: labels from keys), "+ Field" chip rows (hidden structure), Fields/JSON toggle (internal concept), uppercase-tracked table headers in mist-500 (low contrast at 12 px), bordered fieldsets per object (visual noise). Layout: 12-column grid; base unit 8 px (4 px inside dense rows); density modes default (forms) and compact (tables, 44 px rows desktop); breakpoints 390 / 768 / 1024 / 1440. |
| **ui-color-palette** (MCP `get_palette`, TAILWIND preset, OKLCH v3, sources locked to our tokens) | Scales for info (electric-600), progress (sky-500), success-600, warning-700, danger-600, neutral (mist-600) with WCAG and APCA per shade | Status text shades taken from the scales: sky-700 `#00459C`, success-700 `#005836`, warning-800 `#8C4A00`, danger-700 `#AF120D` (brand-700 and mist-700 already exist). Chip backgrounds keep the existing light tints (the generated 50 steps are too saturated for chips). Every pair checked locally for WCAG 2.2: all ≥ 6.2:1 (table in section 4.1). PRD §16 hex values unchanged. |
| **shadcn MCP** (`registries: ["@shadcn"]`) | Registry versions checked: sidebar, breadcrumb, command, table + data-table pattern (TanStack Table v9 `useTable`/`tableFeatures`), sheet, dialog, alert-dialog, drawer, tabs, field (Form), popover + command (combobox), calendar + date-picker, chart (Recharts), tooltip, badge, skeleton, sonner, resizable, scroll-area, toggle-group | Already installed and themed: breadcrumb, command, table, sheet, dialog, alert-dialog, drawer, tabs, field, popover, calendar, tooltip, badge, skeleton, sonner, scroll-area, toggle-group, empty, kbd, progress, switch. **To add in R1–R5:** sidebar, collapsible, resizable, chart, hover-card, context-menu (row menu), avatar group pattern. All restyled with tokens; never default shadcn. |
| **21st.dev** (magic MCP; six options found per need, at least three compared) | Picks in section 14 | dropzone `uvain/file-upload`, crop `originui/image-crop` + in-house focal point, sortable `diceui/sortable`, kanban `diceui/kanban` (+ a non-drag Move menu after `rmahammad/kanban-card-movement`), stepper `corr/stepper`, KPI `uvain/revenue-charts-kpi` (with an SVG sparkline), timeline `olewandowski1/timeline-3`, tag combobox `cnippet-dev/v-combobox-13`, empty states `serafimcloud/empty-state`, date range `sean0205/c-calendar-16`, sidebar groups `felipemenezes098/collapsible-05` on shadcn Sidebar, notification centre `patrick-xin/vercel-notification-popover`. Installed with the 21st.dev URL command when the issue that needs them starts, restyled with tokens, keyboard and reduced motion checked. |
| **design-taste-frontend** and **frontend-design** | Direction and anti-template check | Dials for the admin: variance 3 (predictable), motion 3, density 6. Anti-template rules: no generic "card soup" (cards only where they group work), no gradient KPI tiles, no emoji, one accent colour (electric) for actions, status colours only for status, real thumbnails instead of icon placeholders, numbers in tabular PJS, no centred hero text on work screens. |
| **21st-ui** | Workflow: search → compare → install → adapt to tokens | Followed for every 21st.dev component; the free tier allows two installs a day, so installs are spread across R1–R9. |

**Sidebar colour (owner asked to decide and log):** ui-ux-pro-max does not recommend a light sidebar for this product
(its admin guidance is about contrast and clear hierarchy, both of which the midnight sidebar meets: text 12.7:1, muted
8.3:1). We **keep midnight-950** (D184): it anchors the brand, separates navigation from work and matches the public
footer's calm. The work surface stays light (mist-50 page, white panels).

---

## 3. Information architecture

### 3.1 Sidebar (groups collapse; a count badge wherever work waits; each role sees only its items)

| Group | Item | Route | Badge (polled every 30 s) | Roles |
| --- | --- | --- | --- | --- |
| **Home** | Dashboard (today's work) | `/secure-admin-control` | — | everyone |
| | Reports (includes search activity) | `/reports` | — | admin, accounts, shop-manager, travel-sales, visa-officer |
| **Inbox** | Leads (tabs: All, Flights, Hotels, Packages, Plan my trip, Visa, Printing, Trading, Bulk quotes, EMI, Contact) | `/leads` | new + overdue | admin, travel-sales, visa-officer, shop-manager |
| | Visa applications (checklist stage) | `/leads?module=visa` now, `/visa-applications` in R6 | open visa applications | admin, visa-officer |
| | Orders | `/orders` | to confirm | admin, shop-manager, accounts |
| | Payment proofs | `/payments` | to verify | admin, accounts, shop-manager |
| | Customers (newsletter as a tab) | `/customers` | — | admin, accounts, shop-manager, travel-sales, visa-officer |
| | Feedback | `/feedback` | to approve | admin, content-editor |
| **Travel** | Tour packages | `/content/tourPackages` | — | admin, travel-sales, content-editor |
| | Group fares | `/content/groupFares` | ending this week | admin, travel-sales |
| | Flight routes | `/content/flightRoutes` | — | admin, travel-sales, content-editor |
| | Hotels and places | `/content/hotelPlaces` | — | admin, travel-sales |
| | Visa countries | `/content/visaCountries` | — | admin, visa-officer, content-editor |
| | Visa guides | `/content/visaGuides` | — | admin, visa-officer, content-editor |
| | Airlines and airports (baggage rules as a tab) | `/content/airlines` | — | admin, travel-sales |
| **Waafas World** | Products | `/content/products` | low stock | admin, shop-manager |
| | Categories | `/content/categories` | — | admin, shop-manager |
| | Brands | `/content/brands` | — | admin, shop-manager |
| | Collections | `/content/collections` | — | admin, shop-manager |
| | Deals | `/content/deals` | — | admin, shop-manager |
| | Store home rows (store page texts as a tab) | `/content/storeRows` | — | admin, shop-manager, content-editor |
| | Coupons | `/content/coupons` | — | admin, shop-manager |
| | Product attributes | `/content/attributeSets` | — | admin, shop-manager |
| | Compatible models | `/content/compatibleModels` | — | admin, shop-manager |
| **Website** | Home page (section manager, hero) | `/content?group=home` now, `/website/home` in R7 | — | admin, content-editor |
| | Menus and footer (header, footer, phone) | `/content/menus` now, `/website/menus` in R7 | — | admin (menus are settings documents) |
| | Announcement bar | `/content/announcements` | — | admin, content-editor |
| | Banners and offers | `/content/banners` | — | admin, content-editor |
| | Pages (About, policies, service pages, page blocks) | `/content/pages` | — | admin, content-editor |
| | Blog (categories as a tab) | `/content/blogPosts` | — | admin, content-editor |
| | FAQs | `/content/faqs` | — | admin, content-editor |
| | Gallery | `/content/galleryAlbums` | — | admin, content-editor |
| | Team | `/content/team` | — | admin, content-editor |
| | Media library (Site images tab replaces Media slots) | `/media` | — | admin, content-editor, shop-manager, travel-sales |
| **Settings** (sidebar footer) | One door: `/settings` index of plain sections now (R1), one page with a left sub-navigation in R9 (section 5.6) | `/settings` | setup steps left (R9) | admin, accounts (payments), shop-manager (delivery); Users, Integrations, Advanced: Super Admin |

The sidebar footer holds the account (name, role in plain words, My account, Sign out) and "View site". Content routes
keep the stable `/content/[key]` addresses; staff never read them (breadcrumbs and titles use plain words).

### 3.2 Top bar
- **Search (Ctrl+K)**: one command palette for pages ("Group fares"), records by name, reference or phone
  ("FLT-261019-0001", "01712…", "Bali"), and actions ("New package", "Verify proof", "Change office hours"). Groups:
  Actions, Go to, Leads, Orders, Customers, Content. Recent items first when empty.
- **+ New**: a menu that creates any record the role may create (package, product, visa country, group fare, banner,
  blog post, team member, coupon…), grouped like the sidebar.
- **Notifications bell**: polls every 30 s for new leads, payment proofs and orders (and overdue leads for managers);
  popover on desktop, bottom sheet on phones; grouped by day; each item links to its record; "Mark all as seen".
- **Account**: avatar with initials, name, role, My account, Sign out.
- Breadcrumbs under the top bar on every page below a group root ("Travel › Tour packages › Bali temples and beaches").

### 3.3 "Where is this edited?"
Every Website and record editor shows a one-line *where it appears* under its title ("Shown on the home page under
Popular packages and on /tour-packages"). Staff signed in see a small **Edit this page** button on the public site
(loaded only when the staff hint cookie exists) that opens the right editor; **Edit sections** outlines each section
with a link to its editor (R7).

---

## 4. Visual system (admin tokens; all in `app/globals.css`)

### 4.1 Colour
- Page `mist-50`, panels white, hairlines `mist-200`, row hover `mist-25`, selected row `electric-50`.
- Text `ink-900`, secondary `mist-600` (6.3:1 on white), headings `navy-900`, links and primary actions `electric-600`.
- Sidebar `midnight-950`, text `mist-300` (12.7:1), muted `mist-400` (8.3:1), active item white on a 12 % white wash
  with an electric left marker, badges white on `electric-600` (6.5:1), urgent badges white on `danger-600`.
- **Status families** (chip = light tint background, `currentColor`/20 border, text and icon in the text shade):

| Family | Used for | Text (icon) | Background | Contrast |
| --- | --- | --- | --- | --- |
| info | New, Scheduled, Invited | brand-700 `#003FBE` | electric-50 `#EEF4FF` | 7.75:1 |
| progress | In progress, Packing, Submitted, Matched | **sky-700** `#00459C` | **sky-50** `#ECF6FE` | 8.23:1 |
| success | Live, Booked, Verified, Confirmed, Delivered, Approved, In stock, Active | **success-700** `#005836` | success-50 `#E7F6EF` | 7.69:1 |
| warning | Waiting for customer, Low stock, Ending soon, Documents pending, Expired | **warning-800** `#8C4A00` | warning-50 `#FFF4E2` | 6.23:1 |
| danger | Overdue, Rejected, Cancelled, Out of stock, Spam, Sold out | **danger-700** `#AF120D` | danger-50 `#FDEDEB` | 6.34:1 |
| neutral | Draft, Archived, Lost, Closed, Deactivated | mist-700 `#3E475C` | mist-100 `#EFF2F7` | 8.28:1 |

  New tokens (bold) come from the ui-color-palette scales; existing hex values are untouched.
- Charts: the five `--chart-*` tokens only (D6 rule), never status colours for series.

### 4.2 Type
| Role | Font | Size / line | Weight |
| --- | --- | --- | --- |
| Page title | Plus Jakarta Sans | 26 / 32 (phone 22 / 28) | 800, navy-900 |
| Section title | Plus Jakarta Sans | 17 / 24 | 700, navy-900 |
| Card title, sheet title | Plus Jakarta Sans | 15 / 22 | 700 |
| Body, form inputs | Inter | 16 / 24 | 400 |
| Table cell, list | Inter | 14.5 / 20 | 400 (primary text 500) |
| Label | Inter | 14 / 20 | 600, ink-900 |
| Help, meta | Inter | 13.5 / 20 | 400, mist-600 |
| Numbers (money, counts, dates in tables) | Inter tabular (`tabular-nums`); KPI values PJS 800 tabular | — | — |
| Table header | Inter 13 / 16, sentence case, mist-700, 600 (no uppercase tracking) | — | — |

### 4.3 Density, spacing, shape
- 8 px grid; dense rows use 4 px steps. Page padding 16 (phone) / 24 (768) / 32 (1024+); max content width 1440 px,
  editors 1200 px (form column ≤ 720 px + rail 320 px).
- Table rows 44 px (desktop compact), 56 px with a thumbnail; phone cards ≥ 64 px with 44 px targets.
- Form field height 44 px; gap 20 px between fields, 32 px between sections.
- Radius: inputs and buttons 12 px (pill for primary actions and chips), panels 16 px, sheets 20 px.
- Elevation: panels flat with a hairline; popovers and sheets `shadow-lg` navy-tinted; nothing floats without a reason.
- Icons: lucide 16 px in tables and chips, 18 px in buttons, 20 px in the sidebar; stroke 1.75.

---

## 5. Page patterns

### 5.1 Page header (every page)
Breadcrumbs · **Title** · one-line explanation (what it is, where it shows) · primary action on the right (one only;
secondary actions in a "More" menu). Below it: tabs or saved views when the page has them, then a one-line status
summary when work waits ("3 leads past the reply target").

### 5.2 Dashboard (Home)
1. **Today** queue cards in a row (wrap on phones): New leads (with the oldest reply timer), Overdue leads, Visa
   documents pending, Orders to confirm, Proofs to verify, Feedback to approve, Low stock, Group fares ending this week,
   Sample content left. Each card = count + one line + link to its filtered list; zero shows a calm tick.
2. **KPI cards** (4–5): leads today and this week, booked value, orders, conversion; each with a 14-day sparkline and
   the change in words ("+4 vs last week").
3. Charts: leads by module (horizontal bars) and leads by day (line), five chart tokens at most, each with a data
   table alternative.
4. Recent activity (timeline, plain sentences) and a **setup checklist** that ticks itself (Search Console, GA4 ID,
   Turnstile keys, real photos replacing Sample, office hours, payment details).

### 5.3 List (DataTable, section 10)
Header · search + filter chips + saved views · table (thumbnail + name first, then status chip and key facts) · bulk
bar when rows are selected · pagination with totals. Row click opens a **side sheet** (summary + actions); the name
link opens the full editor. Below 768 px rows become cards.

### 5.4 Editor (sectioned)
- Left: section navigation (sticky; check marks for complete sections, a dot for missing required fields). Purpose-built
  editors use the same rail as steps (Basics → Photos → …); any step is reachable at any time.
- Centre: one column of sections; each section has a title, a one-line description and fields with labels and help.
- Right rail (≥ 1280 px; below that it becomes the top of the form): **Status** chip with its reason, Visibility
  (Publish now / Schedule, Show on website), Preview and View on site, the **publish checklist**, the SEO snippet
  preview, "Edited 5 min ago by Rafi", History, Duplicate, Move to Trash.
- **Sticky action bar** at the bottom: unsaved state ("Unsaved changes · draft saved 10 s ago"), Discard, Save draft,
  Preview, primary Publish / Update. Ctrl/Cmd+S saves.
- Tabs: Edit · History. Advanced (fields outside the blueprint) appears only for the Super Admin, folded at the end.

### 5.5 Inbox (leads, visa applications, orders, payment proofs, feedback)
- Desktop: list (left, 380–440 px, resizable) + detail panel (right). Phone: list → full-screen detail with a sticky
  bottom action bar and Back.
- Detail: header (customer name, reference, status chip with reason, reply timer), **next actions as buttons** (Call,
  WhatsApp, Email, Log quote, Ask for documents, Convert to booking, Close lead…), labelled facts ("Flying from Dhaka
  (DAC) to Bangkok (BKK) · One way · 2 Dec 2026 · 1 adult · Economy"), customer card (other leads and orders by the
  same phone), and the **timeline** (received, contacts, notes, status changes, assignments, all as sentences).
- Leads also have a **board** (kanban by status); dragging runs the same transitions and asks for the same inputs.

### 5.6 Settings
One page, left sub-navigation (phone: a list that opens each section): Business and contact · Office hours · Booking
modes · Payments and delivery (payment accounts, COD, shipping zones, EMI and banks) · Forms and notifications (lead
forms, email and SMS templates) · SEO and tracking · Search · Integrations · Users and roles · Audit log ·
Maintenance · Advanced (raw JSON editor and All content; Super Admin only). Each section is a plain form with its own
save bar.

### 5.7 Media library
Grid (default) and list views; search; filters Photos, Videos, Unused; multi-upload by drag and drop; a details sheet
(preview, alt text, credit, sizes, where it is used with links, Replace everywhere, Delete only when unused). Tab
**Site images** replaces Media slots (one card per page-level photo or video with where it shows).

### 5.8 Website builder
- **Home page**: sections in page order with a thumbnail each, drag to reorder, a "Show on website" switch, Edit in a
  side sheet with a live preview of that section; the hero editor (photo or video, phone version, headline, rotating
  places) with preview.
- **Menus**: a drag-and-drop tree per menu (header, footer columns, phone menu) with a link picker for any page or record.
- Preview of unpublished changes through Next.js draft mode with a banner "Preview of unpublished changes".

### 5.9 States
- **Empty**: icon, what will appear here, what to do next, a primary action ("No packages yet · Add your first
  package").
- **Loading**: skeletons in the shape of the content; buttons show a spinner and keep their width.
- **Error**: a plain sentence with the next step and Retry ("We couldn't load the leads. Check your connection and try
  again."); field errors next to the field and summarised at the top with links.
- **Offline**: a banner "You're offline. Changes are kept on this device and saved when you're back."
- **Forbidden**: "Your role can't open this page. Ask an admin if you need it." with a link home.
- **Session**: a warning two minutes before the session ends ("Stay signed in"), silent refresh while active.

---

## 6. Field widget catalogue (R2 and R3)

| Widget | Use | Behaviour |
| --- | --- | --- |
| TextField / TextArea | names, short copy | Character counter when the schema has a limit; trims on save |
| **SlugField** | record web address | Filled from the title until edited; shows the full URL ("waafasworld.com/tour-packages/bali-…"); "Edit link" reveals the input; changing the link of a live record adds a permanent redirect from the old URL (R4) |
| **MoneyField** | prices, fees, amounts | ৳ prefix, lakh grouping while typing (৳1,46,480), whole taka, "VAT included" hint where it applies |
| NumberField / Stepper | nights, seats, stock | − / + buttons, min/max from the schema |
| **DateField** / **DateRangeField** | departure, start/end, schedule | Calendar popover, Asia/Dhaka, shows "12 Oct 2026"; time picker where a time matters ("10:00 am") |
| Switch | yes/no | Label says what turns on ("Show on website") |
| ChoiceField | 2–5 options | Radio cards or a segmented control (labelled with `aria-labelledby`); Select for more |
| **ReferencePicker** | category, brand, visa guide, related packages, collections | Search with thumbnails and status; single or multi (tag chips); "Create new" inline in a sheet |
| **RichTextField** | pages, blog, service pages | tiptap (installed), headings, lists, links, images from the library; server-sanitised (RichText allow-list) |
| **RepeaterField** | highlights, FAQs, inclusions, nights per city | Cards with a summary line, collapse, drag to order, duplicate, remove with Undo |
| **KeyValueField** | product specs | Two-column table ("Colour · Black"), drag order |
| **PriceTableField** | package prices | Rows of room sharing × price (Twin, Triple, Single, Child) with MoneyField cells |
| **ItineraryField** | package days | Day cards (Day 1 title, plan, meals chips, overnight city), drag order, add day |
| **ChecklistField** | visa documents | Document rows (name, required switch, help), drag order |
| IconPicker | trust items, values | Searchable lucide grid with names |
| ColourPicker | accents | Brand tokens only (swatches with names) |
| **SeoPanel** | every public record | Google snippet preview, title ≤ 60 and description ≤ 155 counters, share image picker, "Hide from search engines" |
| **VisibilityPanel** | publishable records | Status chip with reason, Publish now / Schedule…, end date where it applies, Show on website |
| **MediaField** (R3) | one photo | Drag and drop, click, paste or choose from the library; frame in the field's aspect ratio with its minimum size ("Cover 16:9, at least 1600 px wide"); warning when too small; crop and focal point; alt text required (suggested from the title); credit folded under "Photo credit" |
| **GalleryField** (R3) | many photos | Multi-upload, drag to order, set cover, per-photo alt |
| **VideoField** (R3) | loops, hero | MP4 or WebM up to 50 MB or a link; poster from the library |

Automatic and hidden everywhere: id (generated), slug (from the title), createdAt, updatedAt, updatedBy (shown as
"Edited 5 min ago by Rafi"), publishedAt, image width and height, popularity (replaced by a "Feature" switch and drag
order).

---

## 7. Blueprints (form engine v2, R2)

- One typed blueprint per `CONTENT_MODEL` key, grouped by area in `apps/web/src/lib/admin/blueprints/<group>.ts`
  (settings, home, content, travel, visa, shop) and listed in `registry.ts` as `Record<ContentKey, Blueprint>`, so a
  missing key fails the build (D193). The engine is the generic schema widgets in `components/admin/schema/`
  (`SchemaField` picks a widget per field); `components/admin/editor/ContentEditor` is the v2 shell on top. Not forked.
- Blueprints are plain data (D194): sections, the widget and options per field, automatic rules (id from the title,
  item ids and keys, today / now, day numbers, reading time, a category's level, list order), references
  (`ref: { key, value, embed, fill }`), visibility fields for the side panel, the public address
  (`/tour-packages/{slug}`, or one per record id), the editor heading and the publish requirements. Fields are named by
  pattern: names joined with `_`, list positions left out (`prices_price`), a list item itself is `<list>_item`.
- Words live in messages, never in blueprints: `Admin.blueprints.<key>` (nouns, intro, section titles, record-specific
  labels and help), then the shared `Admin.fieldNames`, `Admin.fieldHelp` and `Admin.choices.<set>`. The server
  resolves them (`resolveBlueprint`) and the editor gets a `ResolvedBlueprint` as props; widget chrome comes from
  `Admin.editor` through a scoped provider.
- Fields not in a section go to **Advanced** (Super Admin only, with the record as JSON). Unit tests
  (`blueprints.test.ts`): every key has a blueprint; it names only fields its schema has; every required top-level
  field is in a section, in Visibility or automatic; nothing is left for Advanced; every visible label and choice has a
  plain-language message (no camelCase, no "ID", brand spellings allowed).
- Small fixed forms (sign-in, invite user, close lead, convert to booking) use React Hook Form + zod with shadcn Field.

### 7.1 What R2 shipped
- Widgets: text and long text with counters, number with − / +, money (৳, lakh grouping, VAT included), slug (follows
  the title until edited, full address, warning on live records), date and date-time (calendar, Today / Now / Clear,
  Asia/Dhaka), time of day, weekdays (Saturday first), switch, choice (radio cards up to six, a list above), several
  choices (chips), tags, lines (one sentence per row, Enter adds the next), repeater (cards with a summary line, fold,
  drag with dnd-kit loaded after hydration, Move up / down, Duplicate, Remove with Undo), reference picker (search,
  thumbnails, Sample and Draft badges, several at once, "New …" in a new tab), icon picker (only icons the site
  draws), colour (system picker, code, colours the product already uses), phone (local numbers become +880…), SEO
  panel (Google preview, 60 / 155 counters, share photo, hide from search engines), map (a variant's option values
  from the product's own options), variant (a deal's product variants), read-only, and an interim photo field (address,
  description, credit) until R3 adds upload and the library.
- Shell: section list with ticks and attention marks (Jump to a section below 1024 px); side panel with the status chip
  and its reason, Visibility, Before you publish, the Google snippet, "Edited 5 min ago by Rafi", History, Duplicate
  and Delete (folded above the form below 1280 px); sticky action bar (Discard, Save draft, Publish / Update, Ctrl or
  Cmd+S); History tab with sentences ("Price per person (2): ৳64,900 → ৳59,900") and Restore this version; the draft
  kept on this device with Restore / Discard after a reload or a new sign-in; the edit-conflict dialog ("Rafi saved this
  2 min ago": See their version / Save mine over theirs); the leave guard (links, Ctrl K, closing the tab); plain errors
  with links to the fields and Retry; the session-ended dialog that signs in again and comes back.
- Status in R2: records with draft / published / archived get Save draft, Publish, Update, Unpublish and Archive
  buttons instead of a status field. Scheduling, expiry and the worker job come with R4.

---

## 8. Status machines (R4; shared in `packages/shared/src/workflow/`, enforced by the API, written to the audit log
and the record's timeline)

Chip = icon + word + colour family + tooltip that says why. Stored values stay as they are today (additive migration);
labels change.

### 8.1 Content (packages, products, visa countries and guides, blog posts, flight routes, pages, albums, team, banners, deals, announcements)
| Chip | Family | Icon | Rule | Tooltip example |
| --- | --- | --- | --- | --- |
| Draft | neutral | pencil | stored `draft` | "Not on the site yet. Publish when the checklist is complete." |
| Scheduled | info | clock | stored `scheduled` (new value) with `publishAt` in the future | "Goes live on 24 Oct 2026, 10:00 am." |
| Live | success | radio | stored `published`, start passed, end not passed | "Live on the site since 12 Oct 2026." |
| Expired | warning | calendar-x | published but the end date has passed | "Ended on 12 Oct 2026 (end date passed)." |
| Archived | neutral | archive | stored `archived` | "Hidden from the site. Restore to edit or publish again." |

Buttons: **Save draft · Preview · Publish** (now, or **Schedule…**) · **Update** (when live) · **Unpublish** ·
**Archive**. Publish stays disabled until the blueprint requirements are met; the rail lists what is missing ("Add at
least one photo", "Add a price"). A worker job publishes scheduled records and expires ended ones every minute, then
revalidates the site. Records live today stay live.

### 8.2 Leads
| Chip | Family | Set by |
| --- | --- | --- |
| New | info | intake |
| In progress | progress | the first contact action: Call, WhatsApp, Email or a contact note (sets first response) |
| Quoted | progress | "Log quote" or "Send quote" |
| Waiting for customer (stored `pending`) | warning | "Ask for documents" or "Ask for payment"; back to In progress on the customer's reply or any contact |
| Booked | success | "Convert to booking" (amount required, VAT included) |
| Lost / Cancelled | neutral | "Close lead" (outcome and reason required) |
| Spam | danger | rules (failed Turnstile, blocked numbers, bursts) or "Mark as spam" |
| **Overdue** (overlay, not a state) | danger | New with no reply 30 minutes after it arrived; the manager is alerted |

"Reopen" (reason required) brings a closed lead back to In progress. The board runs the same transitions and asks for
the same inputs.

### 8.3 Visa applications (visa leads)
Stage from the documents checklist: **Documents pending** (3 of 8, progress ring) → **Ready to submit** (all required
documents received) → **Submitted** (submission date and reference entered) → **Approved** or **Rejected** (outcome
action) → **Passport returned**. Cancelled only through "Close application" with a reason.

### 8.4 Orders
**Placed** → **Confirmed** (payment proof verified, or "Confirmed on call" for cash on delivery) → **Packing** (stored
`processing`: invoice or packing slip printed, or "Start packing") → **Shipped** (courier and tracking number entered) →
**Delivered** ("Mark delivered"; courier API later). **Cancelled** or **Returned** only through actions with a reason.
Stock adjusts automatically (reserved on order, released on cancel and return).

### 8.5 Payment proofs
**To verify** → **Matched** (automatic: reference and amount match an order) → **Verified** (the order becomes paid and,
if placed, confirmed) or **Rejected** (reason required; the customer is notified).

### 8.6 Derived from dates, limits and quantities
- Group fares: Open · Few seats (≤ 3) · **Sold out** (0 seats) · **Expired** (after the deadline or departure); seats drop
  when a lead on that fare is booked.
- Coupons: Scheduled · Active · Used up (uses reached the limit) · Expired.
- Banners, deals, announcements: Scheduled · Live · Ended (from start and end) plus Draft and Archived.
- Products: In stock · Low stock (threshold in Settings, per variant override) · Out of stock.
- Feedback: To review → Approved or Rejected (moderation buttons; only approved feedback with consent is public).
- Users: Invited → Active on first sign-in; Deactivated through an action; Locked while sign-in is locked.

---

## 9. Safety nets (R2, R4)

- **History**: every record has a History tab built from the audit log's before and after values, as sentences
  ("Price from ৳64,900 → ৳59,900, by Rafi, 2 h ago"), with **Restore this version**.
- **Trash**: deleting moves a record to Trash (soft delete, hidden from the site at once), restorable for 30 days; a
  worker job purges older items; permanent delete is Super Admin only.
- **Duplicate**: every record can be duplicated (copy saved as a draft with "(copy)" in the title and a new link).
- **Edit conflicts**: saving sends the record version; if someone saved first, show "Rafi changed this 2 min ago" with
  Reload or Keep my changes. Never a silent overwrite.
- **Errors**: every API problem becomes a plain sentence with a next step and Retry; an offline banner when the network
  drops; typed data is never lost (autosaved drafts in local storage, restored after a reload or a new sign-in).
- **Session**: warning before the session ends, silent refresh while active; signing in again returns to the same
  screen with the unsaved draft.
- **Sample content**: a Sample badge on the record and in lists; the first staff save clears the flag (toast with Undo);
  the dashboard shows "Sample content left: n"; the Super Admin can bulk-delete the rest after a confirm.

---

## 10. DataTable (R5; one component for every list)

- First column: thumbnail (40 px, rounded 8) + human name + one secondary line; then the status chip and the key facts
  (price in ৳ with lakh grouping, dates as "12 Oct 2026" or "2 h ago", the assignee's avatar).
- Toolbar: search, filter chips (status, module, assignee, date range), saved views per user, column visibility, export.
- Sort by clicking headers (aria-sort); sticky header; selection checkboxes with a bulk bar (Publish, Archive, Assign,
  Export CSV, Move to Trash).
- Server pagination with totals ("1–25 of 312") and page size 25/50/100; skeleton rows while loading; designed empty
  states per list.
- Row click → side sheet with a summary and actions; editing opens the full editor; keyboard: ↑/↓ moves the focus, Enter
  opens, Space selects, Esc closes the sheet.
- Below 768 px rows become cards (thumbnail, name, chip, two facts, chevron).
- Performance: TanStack Table v9 with only the features used; INP under 200 ms on 500 rows (rows memoised; selection
  without full re-render).

---

## 11. Media (R3)

Every image and video field uploads: drag and drop, click, paste from the clipboard, or choose from the library. Upload
progress; type and size checked before upload (JPG, PNG, WebP, AVIF up to 12 MB; MP4 or WebM up to 50 MB on its own
route with a raised body limit only there); a frame with the field's aspect ratio and minimum size; a warning when the
photo is too small; crop and focal point (stored with the image so `object-position` follows it); alt text required and
suggested from the title; credit folded under "Photo credit". The server keeps the existing pipeline (sharp:
auto-rotate, at most 2560 px, WebP, metadata stripped, width and height stored); next/image makes the sizes.

---

## 12. Motion (admin)

- 150–200 ms for colour, opacity and small transforms; sheets and dialogs use the existing sheet spring (380/34);
  popovers 150 ms fade + 4 px rise; no page transitions inside the admin (instant navigation).
- Moments that earn motion: a status chip cross-fades when an action changes it; a new timeline item fades in and rises
  8 px; a dragged row lifts (scale 1.02, shadow) and others slide with layout animation (dnd-kit transforms); toasts
  slide 200 ms; the publish button shows a brief tick.
- Skeleton shimmer and count-up stop under reduced motion (final values shown); drag uses no spring under reduced motion.

---

## 13. Words

| Internal | Staff sees |
| --- | --- |
| ID, Created at, Popularity | (hidden; automatic) |
| Slug | Web address (with "Edit link") |
| Src, Width, Height | the photo itself (MediaField) |
| Alt | Describe the photo |
| Credit, Credit URL | Photo credit (folded) |
| Brand ID, Category ID, Guide slug, Related slugs, Collection ids | Brand, Category, Visa guide, Related packages, Collections (pickers) |
| Default variant ID | Main option (radio in the variants table) |
| status `published` | Live (chip) |
| `pending` (lead) | Waiting for customer |
| `processing` (order) | Packing |
| module `plan-trip`, `bulk`, `emi` | Plan my trip, Bulk quote, EMI |
| source `web` | Website |
| `economy`, `one-way`, `regular` | Economy, One way, Regular fare |
| "1 records" | "1 record" (ICU plurals everywhere) |
| JSON tab | (Advanced only, Super Admin) |

Dates: "12 Oct 2026", "12 Oct 2026, 5:35 pm" (Asia/Dhaka), relative when recent ("2 h ago"). Money: ৳ with lakh
grouping. Phone numbers: "+880 1712-345678".

---

## 14. Component set

| Component | Source | Where |
| --- | --- | --- |
| AdminSidebar (groups, badges, collapse to icons) | shadcn **sidebar** + **collapsible**; groups pattern from 21st.dev `felipemenezes098/collapsible-05` (compared with `wensity/sidebar`, `starc007/animated-sidebar`, `uiable/list-group-badge`) | shell |
| AdminTopBar, Breadcrumbs, PageHeader | shadcn **breadcrumb**, **dropdown-menu**, **avatar**; in-house | shell |
| CommandPalette | shadcn **command** + **dialog** | shell |
| NotificationCentre | 21st.dev `patrick-xin/vercel-notification-popover` (popover on desktop, sheet on phones; compared with `uvain/notification-panel`, `amanshakya1808/notification-center`, `baileyrosen3/notification-center`) | top bar |
| StatusChip | shadcn **badge** + **tooltip**, in-house variants (cva) | everywhere |
| EmptyState (admin) | 21st.dev `serafimcloud/empty-state` (compared with `uiable/empty-background`, `olewandowski1/empty-states-1`, `shadcnui-blocks/empty-state-04`) on shadcn **empty** | lists, inbox |
| Skeletons | shadcn **skeleton** | lists, detail |
| DataTable | shadcn **table** + data-table pattern (TanStack Table v9), **checkbox**, **dropdown-menu**, **context-menu** | every list |
| RowSheet | shadcn **sheet** (side="right") | lists |
| Editor shell (section rail, action bar, right rail) | in-house on shadcn **scroll-area**, **separator**, **tooltip** | editors |
| Stepper (purpose-built editors) | 21st.dev `corr/stepper` (compared with `shadcnspace/stepper-02`, `ddoemonn/wizard-steps`, `nyxbui/stepper`) | R8 editors |
| SortableList | `diceui/sortable` pattern (Root, Item, Handle) on `@dnd-kit/core` 6.3.1 + `sortable` 10 + `modifiers` 9, built in-house because the free retrieval quota was used (compared with `ddoemonn/reorder-list`, `ebnsina/sortable`, `nikhiljainsam/draggable-priority-list`, `ai2/item-drag` for the grip and ghost look); loaded after hydration, Move up / down kept as the single-pointer way (WCAG 2.5.7) | repeaters, lines; home sections, menus, galleries later |
| ReferencePicker | shadcn **popover** + **command** with thumbnails, Sample / Draft badges and "New …" (combobox pattern of `uvain/combobox-multi-create`, compared with `cnippet-dev/v-combobox-13`, `coss.com/combobox`, `anubra266/basic-tags-input`) | every reference field |
| IconPicker | shadcn **popover** + **command** over the site's own icon set (compared with `sirwhod/icon-picker-3`, `oldkong88/lucide-icon-drawer`, `ddoemonn/filter-grid`) | trust items, menus, categories |
| ColourField | system colour picker + code + the product's own colours (compared with `arikchakma/cromia-swatches`, `micka_design/color-picker`, `wensity/color-picker`; no colours written in code, guards) | product option values |
| Unsaved-changes bar | in-house sticky action bar and leave dialog (compared with `stvenchg/unsaved-changes`, `yadwinder/toast-save`, `KarrixLee/unsave-popup`) | editors |
| LeadBoard | 21st.dev `diceui/kanban` (compared with `uvain/kanban-board`, `adrielzimbril/kanban`, `cult-ui/kanban-board`) + a "Move to…" menu after `rmahammad/kanban-card-movement` | leads board |
| Timeline | 21st.dev `olewandowski1/timeline-3` (compared with `kuratlielia/timeline`, `felipemenezes098/item-19`, `cubby-ui/timeline`) | inbox detail, History |
| TagCombobox | 21st.dev `cnippet-dev/v-combobox-13` (compared with `coss.com/combobox`, `geekles007/multiple-select`, `shugar/combobox`) on shadcn **popover** + **command** | ReferencePicker (multi) |
| DateField, DateRangeField | shadcn **calendar** (react-day-picker 10) + **popover** with month and year dropdowns and Today / Now / Clear (R2; compared again with `wensity/date-picker`, `ai2/date-picker-preset`, `originui/calendar`, `shadcn/calendar-picker-in-a-drawer`); range presets from `sean0205/c-calendar-16` for reports (R9) | editors, reports |
| KpiCard + Sparkline | 21st.dev `uvain/revenue-charts-kpi` (compared with `makviesainte/progress-metric-card`, `appica-dev/sparkline`, `wensity/card`); sparkline as inline SVG | dashboard |
| Charts | shadcn **chart** (Recharts, dynamic import) | dashboard, reports |
| Dropzone | 21st.dev `uvain/file-upload` (per-file progress, retry, explained guards; compared with `ephraimduncan/file-upload-01`, `joyco/file-dropzone`, `wensity/file-uploader`) on react-dropzone | MediaField, GalleryField, media library |
| ImageCrop + FocalPoint | 21st.dev `originui/image-crop` (fixed-aspect zoom and pan; compared with `haydenbleasel/image-crop`, `ruixen.ui/image-cropper`, `shadcnspace/file-upload-05`); focal point in-house | MediaField |
| Resizable inbox panes | shadcn **resizable** | inbox (desktop) |
| Toasts with Undo | shadcn **sonner** | everywhere |

Admin-only libraries (`@tanstack/react-table`, `@dnd-kit/*`, `react-dropzone`, tiptap, Recharts, the cropper) load
with dynamic import inside admin routes and never reach public bundles (budget e2e unchanged).

---

## 15. Before → after (audit of 19 Oct; screenshots local only)

Screenshots: `test-results/admin-audit/before/<nn>-<screen>-<1440|390>.png` (54 screens × 2 widths, gitignored), taken
on a production build against a fresh local database with Sample content and 15 Sample leads, 5 orders, 4 proofs, 3
feedback.

| Screen (shot) | Problems found (principle) | Fixed in |
| --- | --- | --- |
| Sidebar (all) | 40 items in one long list; Group fares and Flight routes under Sales; "Visa applications" is only a leads filter; "Media slots" and "All content" are internal ideas; no counts where work waits; nothing says where a part of the website is edited (1, 2, 5) | R1 |
| Top bar (all) | Search finds pages and a typed reference only; no + New; no notifications; no breadcrumbs (2, 3) | R1 |
| Sign-in (00) | Decent, but no lockout explanation until it happens; "Keep me signed in" unclear; TOTP note shown to everyone (1) | R1 |
| Dashboard (01) | KPI tiles without a next step; "Leads by status" shows one bar; "Top searched routes" empty box; activity rows are codes ("FLT-261019-0003 Website · Received from the website") repeated 15 times; no Today queue, no setup checklist (2, 4) | R9 |
| Leads list (02) | Status filter is a dropdown; module and status as raw chips; "web" source; age "25 min" without the reply target; no assignee avatars; codes first instead of the customer (1, 4) | R5, R6 |
| Lead detail (04) | Status, assignee and priority are **free dropdowns**; the request reads "Search › Legs › 1 › To · BKK", "economy", "one-way", "regular"; a **Raw JSON** toggle; Call and WhatsApp buttons don't change anything; on 390 px the contact buttons come after the request and timeline (1, 3, 4, 8) | R2 (facts), R4, R6 |
| Lead board (03) | Columns per raw status; drag sets any status without inputs (4) | R6 |
| Visa applications (05) | Just the leads list filtered by module; no checklist, no stage (2, 4) | R6 |
| Orders (06) and order detail (07) | "Move to" status **dropdown**; "Mark payment verified" separate from proofs; no next step suggested; history as raw statuses (3, 4) | R4, R6 |
| Payment proofs (08) | "Paid to acc-bkash" (a raw account ID); no link to the order and no matching (a proof for a reference that does not exist looks the same as a good one); Reject asks no reason and tells nobody (1, 4) | R4, R6 |
| Customers (09, 10) | Phone numbers unformatted ("+8801000000304"); profile lists requests by reference code first; no next action (call, WhatsApp) on the profile (1, 2) | R5, R6 |
| Feedback (11) | Reasonable buttons; no queue counts; consent hidden in small text (2) | R5, R6 |
| Reports (12), Search activity (13) | Date range as US-format native inputs ("09/20/2026"); the per-day chart has no axis or dates; "Booked 0 · 0%"; CSV only, no Excel (1, 2) | R9 |
| All content (14) | 55 cards labelled "Setting" or "1 records"; Payments cards repeated in two groups; no description of what each controls on the site (1, 2) | R1 (IA), R9 (Settings) |
| Package list (15) | Title + raw ID + Move up/down; no thumbnail, price, dates or status; no pagination (4, 5) | R5 |
| Package editor (16, 17) | A 12,600 px single form: **ID** and **Slug** inputs, "Destination slug", categories as raw selects ("international"), "Includes short", cover as **Src / Width / Height / Credit / Credit URL** text boxes, "Faqs", **Related slugs**, **Popularity 70**, **Published at 08/28/2026** (US format), **Status dropdown "published"**, "+ Video + Group size + Visa note" chips, a JSON tab (1, 3, 4, 5) | R2, R3, R4, R8 |
| Product editor (19) | ID, Slug, Brand ID ("brand-better-day"), Category ID ("cat-toner"), Default variant ID and Collection ids as text; highlight icons typed by name ("file-text"); variants as nested object cards; "+ Badges + Card spec + Video + SEO" chips (1, 5) | R2, R3, R8 |
| Visa country editor (21) | Visa types as nested objects with fee fields; documents as repeated text boxes; Guide slug (1, 5) | R2, R8 |
| Group fares (22, 23) | The ID is the list title ("gf-ek-dxb-1114"), "seed" as the editor; seats and deadline without a status (1, 4) | R5, R8 |
| Home group (25), home sections (26), home copy (27) | Sections listed by key ("hero", "trust", "groupFares") with Move up/down; no thumbnails, no Show on website switch in the list, no preview; hero copy and images split across records (1, 2, 5) | R7 |
| Banners (28, 29) | Start and end as raw date-time inputs; no scheduling chip (4) | R4, R7 |
| Team (30, 31), Gallery (32) | Photo as Src text box; gallery as repeated Src blocks (3) | R3, R8 |
| Pages (33), Blog editor (34) | Rich text inside the generic form; no writing view, no preview (2) | R2, R8 |
| Menus (35, 36) | Nested object cards with href text inputs; no tree, no link picker (1, 5) | R7 |
| Media library (37) and Media slots (38, 39) | Single file input, "copy a photo's address into any image field"; slots as a separate content list (3) | R3 |
| Booking modes (40), Footer (41), Contact (42), settings group (43, 44) | Raw forms; office hours as nested objects; extra phones as object cards (1) | R9 |
| Notifications (45) | A delivery log only; templates edited elsewhere with `{{variables}}` typed by hand (1) | R9 |
| Users (46) | Staff are added with a password typed by the admin (no invite by email); roles are picked without a plain description of what each role can see and do (1) | R9 |
| Integrations (47) | Works (#108); dense cards with technical words (1) | R9 |
| Audit (48) | Raw events ("Deploy seed · seed.patch · content/2026-10-14-home-seo") with a "Show the change" JSON diff (1, 4) | R9 |
| Categories (51), Coupons (52, 53) | Flat list with the web address under each name and Move up/down; the parent category is an ID field; coupon dates and limits without a status (1, 4, 5) | R2, R4, R5 |

### Plan by issue
R1 shell and design system · R2 form engine v2 · R3 media · R4 status automation · R5 DataTable v2 · R6 inbox · R7
website builder · R8 purpose-built editors · R9 dashboard, settings, users, audit, notifications, reports · R10
usability QA (14 staff tasks as e2e, axe, screenshots at 390/768/1024/1440, independent review, `docs/ADMIN_GUIDE.md`).
