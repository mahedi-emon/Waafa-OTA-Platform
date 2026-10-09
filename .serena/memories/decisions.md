# Decisions (full table in docs/TRACKER.md)
- D1 Project #4 "Todo" = Ready. D2 attribution off. D3 local Node 25, CI Node 22, pnpm pinned. D4 label prefixes.
- D5 milestone dues. D6 PRD beats skills (Inter+PJS, lucide, light-only). D7 shadcn CLI file names; custom PascalCase.
- D8 --primary/--ring electric-600. D9 logo full colour on light only, light footer. D10 header 64/72 px.
- D11 above-the-fold motion in CSS. D12 TS 6.0.3 + ESLint 9. D13 single [locale] root layout, admin at [locale]/admin.
- D14 next-intl no detection/cookie. D15 Tailwind via @tailwindcss/postcss. D16 default palette removed.
- D17 shadcn radix-nova + Lucide + pointer. D18 framer-motion removed; pnpm allowBuilds denies 3 scripts.
- D19 LogoLockup = supplied cut-outs via next/image (no hand-traced SVG). D20 buttons are full pills 48/38/56, icon 44.
- D21 hover = instant colour or overlay opacity; accordion fades (no height anim). D22 "Waafa Taka" ৳ subset font.
- D23 grids use grid-cols-1 at phone base; carousels contain inline size. D24 NextIntlClientProvider messages={null};
  client leaves get strings as props or pickMessages scoped provider. D25 WhatsApp/Facebook glyphs from Simple Icons.
- D26 /styleguide only in dev and STYLEGUIDE=1 builds (turbo build env declares STYLEGUIDE).
- Gotchas: Radix radios are buttons -> name them with aria-labelledby (axe ignores wrapping labels). Tabs need panels.
  Feature code imports MotionKit files directly (not the barrel). On Windows kill node children of stopped servers.
