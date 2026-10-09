# Data layer (A4, decisions D27–D35)
- Contracts: packages/shared/src/schemas/* (zod 4, .strict()); helpers in packages/shared/src/helpers (reference,
  phone, officeHours, Dhaka time); formatters in packages/shared/src/format (formatTaka ৳1,46,480, formatDate
  "12 Oct 2026", formatTime 24h Dhaka).
- Fixtures: fixtures/src/* written as zod inputs; loadFixtures() parses (defaults) and deep-freezes (copy before
  sort). Every record sample: true. Sample people "Sample …", example.com, 010 prefix. Images via photo(key) and
  productShot(file) in fixtures/src/images.ts → /media/photos/<key>.jpg, /media/products/prod-*.jpg (A5 branch).
- Web: apps/web/src/lib/data/types.ts (repository interfaces per domain), fixtures/ (pure fixture repositories that
  take `now`), source.ts (server-only; Phase C swaps to the API here), accessors settings/content/travel/visa/shop/
  leads/query.ts with 'use cache' + cacheLife + cacheTag(CACHE_TAGS in tags.ts). cacheTag throws outside 'use cache'
  → unit tests target repositories, not accessors.
- Only src/lib/data may import @waafa/fixtures (guards rule 5). createLead returns a reference, stores nothing (D35).
- Time-dependent UI (Open now chip, countdowns) computes on the client in Asia/Dhaka.
