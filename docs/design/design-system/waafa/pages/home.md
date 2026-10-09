# Home page overrides (WAAFA)

> Overrides `../MASTER.md` for `/`. Source: PRD §7 FR-HOME, HANDOFF route table (Home, Home-t, Home-m, Home-mfull,
> Home-lower), DESIGN.md, MOTION.md §8. Generator suggestion (single narrow column, "chapters") rejected: an OTA home
> leads with search and a clear section rhythm.

## Layout
- Hero: headline on white (two lines; the second line electric-600), rotating destination chip, inset rounded media
  panel (real video loop, poster = LCP image), glass search card overlapping the panel's lower edge. On a 390 px
  phone the search card's first field and the Search button sit above the fold.
- Then, in admin order and visibility: trust strip, offers carousel, group fares rail, destinations grid, featured
  packages (horizontal scroll on phones), visa countries, Why Waafa (bento), Waafas World band (text name, no second
  logo), testimonials (approved only, else the Facebook link and a Leave feedback card), gallery strip + latest posts
  + five FAQs, Meet our team (bento on desktop, snap carousel on phones; hidden when empty), newsletter + WhatsApp band.
- At least four different layout families across the sections; no two adjacent sections share one.

## Motion
- Hero flight-path line (CSS, once), word-by-word headline in CSS, slow ribbon parallax on desktop only.
- Section reveals once with 40–60 ms stagger; nothing animates the poster before LCP.

## Performance
- First-load JS ≤ 200 KB gzip; the video starts only when visible, never on Save-Data, 2G/3G or reduced motion.
- Every carousel reserves its height; CLS ≤ 0.1.
