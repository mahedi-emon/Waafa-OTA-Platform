# Motion system (full: docs/design/MOTION.md; HANDOFF Motion table; v4 signature moments land in MOTION.md via #34)
- Library: motion 14, LazyMotion strict + `m.*` (import from "motion/react-m"); domAnimation by default, domMax
  (layoutId, drag) loaded async only where used. MotionProvider in root layout (MotionConfig reducedMotion="user").
- MotionKit (apps/web/src/components/motion): PageTransition (template.tsx, fade + 8px rise, skips first load),
  Reveal, Stagger/StaggerItem (40–60 ms, max 8), CountUp (owner numbers only), Marquee (pauses on hover/reduced),
  Parallax (desktop), PressScale, DrawCheck. To add when first needed: DrawPath, Magnetic (≤6 px desktop), Sheet.
- Tokens: springs tab 500/38, sheet 380/34, lift 300/24, pop 600/22; page enter 420 ms; reveal 560 ms once;
  toasts 350 ms; success check 700 + 450 ms stroke; hold timer scaleX.
- Rules: transform + opacity only (small SVG pathLength and desktop blur excepted); above-the-fold motion in CSS
  (LCP never waits for JS, nothing animates the LCP element); heavy effects desktop-only (spotlight, tilt, parallax,
  beam, sheen); off-screen loops pause; 60 fps mid-range Android, trace at 4x CPU, no long task > 50 ms.
- Reduced motion: movement → 150 ms fade; marquee, video, Ken Burns stop; counters final number; signature moments
  show end state.
- Signature moments (v4): hero flight-path line; search card → results bar morph (layoutId); route arc + gliding
  plane on flight query; boarding-pass success (slot slide, drawn check, light confetti); visa checklist ticks +
  progress ring; store variant morph, image crossfade, add-to-cart arc + badge pop; magnetic primary buttons (desktop).
