# Admin control (CLAUDE.md "Admin control"; matrix = docs/TRACKER.md section 4, rows AC-01..AC-56)
- Nothing visible is hard-coded except the footer developer credit (code) and compliance rules. Content = data layer;
  UI chrome strings = next-intl messages (apps/web/messages/en.json).
- Every public element needs a matrix row: element → accessor field → admin screen → API endpoint (Phase B) →
  verified (Phase C). An issue is not done until its rows exist; new fields need a schema in packages/shared, a
  fixture, a repository method, a cached accessor and the admin screen that edits it (A18–A21).
- Admin screens (AdminSide board names): Sales (Leads, Group fares, Bookings, Search activity), Travel (Tour packages,
  Visa), Waafas World (Products, Categories, Collections, Coupons, Orders), Content (Pages/blog/FAQs, Home and
  banners, Gallery, Feedback, Team, Media library), Settings (General, Footer and menus, Booking modes, Payments and
  delivery, Notifications, Users and roles).
- Phase A fixture repositories are read-write in memory (reset on restart) so admin edits show on the public site and
  can be e2e-tested; mutations must call updateTag/revalidateTag for the CACHE_TAGS the accessors use.
- Media slots (MediaSlotKey: home-hero, flights-header, … office) hold page-level photos/videos editable in the
  media library (A20).
