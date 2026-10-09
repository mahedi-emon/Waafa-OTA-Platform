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
- D37 drawn prototype loops never ship; real footage; route map becomes live SVG. D38 dangerouslySetInnerHTML only in
  components/content/RichText.tsx + components/seo/JsonLd.tsx. D39 hex guard on apps/web/src; brandColors.ts.
- D40 magic MCP uses TWENTY_FIRST_API_KEY; CLI `${API_KEY_21ST:-$TWENTY_FIRST_API_KEY}`. D41 husky sets local
  core.hooksPath; CI HUSKY=0. D42 job-level path filters. D43 Project dates/estimates. D44 no Phase F words (guards).
- D45 credits file docs/design/MEDIA_CREDITS.md.
- Gotchas: Radix radios need aria-labelledby; tabs need panels; import MotionKit files directly; on Windows kill node
  children of stopped servers; shadcn MCP needs registries ["@shadcn"].
