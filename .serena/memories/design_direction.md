# Design direction (full: docs/design/DESIGN.md, MOTION.md, COMPETITOR_BENCHMARK.md)
- Read: trust-first travel + commerce for first-time travellers on mid-range Android. Airline-lounge calm.
  Dials (taste): variance 6, motion 5, density 4.
- Colour: primary electric-600 #0053D7 (hover brand-700 #003FBE, pressed royal-800), headings navy-900 #00185B,
  text ink-900 #0E1424, secondary mist-600 #556078, hairline mist-200, panels mist-50, dark midnight-950 #020D39,
  cyan-400 only on dark, gold-600 triangle marker only (never text). Ribbon 120deg gradient once per view.
- Type: Plus Jakarta Sans 700/800 headings (navy, one colour; only the home hero h1 second line is electric),
  Inter body 16px; figures tabular PJS 800. No eyebrow on every section, no accent words, no em dashes in UI copy.
- Radius 6/8/12 inputs+buttons/16 cards/20 panels/28 search card+sheets/full chips. Navy-tinted shadows; glass only
  on the search card. Container 1320, gutters 16/28/40, sections 44/64/88.
- Logo: full colour on white or mist-50 only; never on navy/photos; footer is light (mist-50); header 64/72 px,
  transparent at top over the white hero, solid + blur after 24 px. Home hero = headline on white + inset rounded media
  panel + search card overlapping its lower edge. "Waafas World" is text, never a second logo.
- Cards: boarding-pass fare cards (big IATA, dashed path, stub notch, Indicative label); product cards with labelled
  Save ৳ and Add -> stepper; package cards with nights per city and "from ৳ per person, twin sharing".
- Motion: transform/opacity only; above-the-fold motion is CSS (word reveal) so LCP never waits for JS; Reveal never on
  hero; PageTransition skips first load; springs tab 500/38, sheet 380/34, lift 300/24, pop 600/22; stagger 50 ms max 8;
  desktop-only: lift/zoom/spotlight/tilt/beam/sheen/parallax; reduced motion = 150 ms fades, loops stop.
- Benchmark (Lighthouse mobile, best of 4): Perf 35, A11y 88, BP 73, SEO 100, LCP 12.5 s, 1.7 MB JS. Targets:
  Perf >= 90, A11y >= 95, BP >= 95, SEO 100, LCP <= 2.5 s, first-load JS <= 200 KB gz.
