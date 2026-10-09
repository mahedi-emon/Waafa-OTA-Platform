# Flights and hotels overrides (WAAFA)

> Overrides `../MASTER.md` for `/flights`, `/flights/group-fares` and `/hotels`. Source: PRD §8 (Manual mode now,
> Live later), HANDOFF route table (Flights*, FlightsFare, GroupFares*, Hotels*), MOTION.md §8.

## Layout
- One results shell: the trip summary bar (route, dates, travellers, Edit) on top, then the ResultsBody slot.
  Manual mode: a two-step query form (contact, then trip details) with the route arc, an "Indicative, confirmed by
  an expert before you pay" note, Turnstile, and a boarding-pass success with the reference number.
- Group fares: boarding-pass fare cards (large IATA codes, dashed path, stub notch, seats left, Indicative label,
  Request button); empty state offers a custom query.
- Phones: the summary bar collapses to one line with Edit; the form's primary button stays pinned above the tab bar.

## Motion
- Search card → results bar morph; route arc with a gliding plane; boarding-pass success with a drawn check.

## Content
- Never fake live availability or "lowest price"; fares are indicative until an expert confirms them.
