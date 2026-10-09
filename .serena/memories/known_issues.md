# Known issues (mirror of docs/TRACKER.md section 9)
- Shop numbers disagree across boards: COD cap ৳20,000 vs ৳25,000; free delivery ৳3,000 vs ৳5,000. Fixtures use
  20,000 / 3,000 until the owner confirms (owner question).
- Phase A lead references restart at 0001 on dev-server restart (no storage before the API) — by design.
- ui-color-palette MCP returns 503; its skills wait for it.
- Machine memory is tight (~1–2 GB free): one build/e2e at a time, Playwright --workers=2, stop servers you start.
- Permission classifier blocks git clean/restore of others' work: commit WIP to its branch instead.
