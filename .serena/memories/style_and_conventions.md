# Style and conventions
- TypeScript strict; function components; named exports for components; files kebab-case (motion-provider.tsx).
- "use client" only on modules that need it (motion helpers are client-only).
- Short JSDoc on exported helpers; otherwise light comments.
- Phone first (390px, check 320px), then 768 and 1440. Match screens in docs/design/project.
- Animate only transform and opacity; under prefers-reduced-motion movement becomes a 150 ms fade (REDUCED_FADE).
- Inside LazyMotion strict, use `m.div` etc., never `motion.div`.
- Sample data in /fixtures, marked Sample. Follow docs/design/web-interface-guidelines.md (a11y, focus, hit targets).
