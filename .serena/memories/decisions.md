# Decisions (full table: docs/TRACKER.md section 8)
- D1 Project "Todo" = Ready. D2 attribution off. D3 local Node 25, CI Node 22, pnpm pinned. D4 label prefixes.
- D5 milestone dues (A 11 Oct, B 12, C 13, D 13 Nov, E/F open). D6 PRD beats skills (Inter+PJS, lucide, light-only).
- D7 shadcn CLI file names; custom PascalCase. D8 --primary/--ring electric-600. D9 logo full colour on light only,
  light footer. D10 header 64/72 px. D11 above-the-fold motion in CSS. D12 TS 6.0.3 + ESLint 9.
- D13 single [locale] root layout, admin at [locale]/admin. D14 next-intl no detection/cookie. D15 @tailwindcss/postcss.
- D16 default palette removed. D17 shadcn radix-nova + Lucide + pointer. D18 framer-motion removed.
- D19 LogoLockup = supplied cut-outs via next/image. D20 pill buttons 48/38/56, icon 44. D21 hover = colour/overlay;
  accordion fades. D22 "Waafa Taka" ৳ subset font. D23 grid-cols-1 at phone base. D24 messages={null} + pickMessages.
- D25 WhatsApp/Facebook glyphs from Simple Icons. D26 /styleguide dev + STYLEGUIDE=1 only.
- D27 UI reads cached accessors only; fixture repos pure with `now`. D28 fixtures zod inputs, frozen.
- D29 headed sections for pages/blog/guides. D30 visa embassy fee null by default. D31 sample people rules.
- D32 gallery/feedback/team sample rules. D33 package categories[]/months[]; airline strip featuredOrder.
- D34 /shop/printing-solutions, /shop/international-trading. D35 Phase A createLead stores nothing.
- D36 v4 adopted: #1–#22 = A1–A22, A0 #27, epics #28–#33, A1b #34; A17 = system states + LiveBody placeholder only.
- D37 drawn prototype loops never ship; real footage. D38 dangerouslySetInnerHTML only RichText + JsonLd.
- D39 hex guard on apps/web/src; brandColors.ts. D40 21st key env names. D41 husky local hooksPath; CI HUSKY=0.
- D42 job-level path filters. D43 Project dates/estimates. D44 no Phase F words (guards). D45 MEDIA_CREDITS.md.
- D46–D55 (A6/A5): login hidden until accounts; navs read pathname after hydration; config cache hours; no root-params;
  announcement dismissal localStorage; tagline from 1280; Radix focus proxy excluded from axe; RSC prefetch 404s allowed
  until A22; six real clips; media slots.
- D56 inner-page competitor Lighthouse = 1 run on package listings.
- D57 search tabs/trip pill = CSS transform (no layoutId/domMax). D58 country code chip, no flags. D59 card one row from
  xl (1280). D60 Back restore via sessionStorage snapshot (+ Activity). D61 pickers/popover/vaul/submit logic lazy.
  D62 no tour budget field (board). D63 week starts Sunday; >30-night days disabled.
- D64–D77 (A7–A10): see TRACKER; D75 one LeadRequestCard (contact first) for every Manual module.
- D78 unknown package slug = Next not-found, status 200 + noindex (Cache Components streaming); branded 404 in A17.
  D79 package query inline at #query, booking card choices via PackageBookingProvider. D80 Plan my trip contact first,
  help card instead of live summary. D81 package filters GET form. D82 plan place chips in SearchSettings.planTripPlaces.
  D83 native date inputs on Plan my trip. D84 package lightbox via next/dynamic.
- D85 param pages await params inside Suspense (Next 16.4 instant-navigation check). D86 visa apply = LeadRequestCard,
  contact first + one trip/documents step. D87 Phase A visa files stay in the browser, metadata only. D88 sanitize-html
  in RichText (server-only). D89 visa type client state mirrored to ?type= (replaceState). D90 fully static pages use
  the Canonical component (hoisted link), NOT alternates.canonical (build fails on /[locale] shell). D91 checklist
  ticks not stored; SVG ring.
- D92 bulk lead module QTE (dialog, store wording via contactCopy). D93 ShopContent + StoreRow title/subtitle.
  D94 withDeals = one effective price. D95 guest cart localStorage store (components/shop/useCart); cart page A14.
  D96 listing GET filters, select attributes only (`a.<key>` params). D97 finder two GET steps. D98 hide empty
  categories on store home. D99 product video under description. D100 shared PhotoLightbox. D101 Canonical on static
  store pages.
- D102 one shared priceCart (browser sends ids and quantities only). D103 free delivery on pre-coupon subtotal; zone from
  address. D104 one-page checkout, success in place, cart cleared. D105 Phase A store on globalThis. D106 payment proof
  metadata only; DocumentSlot in components/forms. D107 stock not decremented in Phase A; mini-cart drawer etc. cut to A22.
- D108 service pages = ServicePage record + shared request card. D109 attachments metadata only. D110 PageBlock collection
  for info page cards. D111 About route chips (map in A22). D112 empty office slot → navy visit card. D113 directions
  link, no map iframe. D114 gallery videos open externally. D115 optional feedback rating, never an average.
- Gotchas: Radix radios need aria-labelledby; tabs need panels; import MotionKit files directly; on Windows kill node
  children of stopped servers; shadcn MCP needs registries ["@shadcn"]; react-day-picker v10 `selected` needs onSelect
  (use custom modifiers); shadcn Calendar `classNames` REPLACE defaults per key; ghost Button `before:` overlay shows on
  hover (add before:hidden); PowerShell Move-Item treats [locale] as wildcard (use bash mv / -LiteralPath); Radix RadioGroupItem
  with className "sr-only" stays in the flow (use "absolute inset-0 size-full opacity-0 after:hidden" + relative label);
  Radix SelectValue is empty on SSR (pass the label as children); a stale `next start` on port 3100 makes e2e test an
  old build (kill it first).
