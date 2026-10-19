# Media library overrides (WAAFA Admin)

> Overrides `../MASTER.md` for `/secure-admin-control/media` and every media field. Full spec: `docs/design/ADMIN.md`
> §5.7 and §11. Generator output (19 Oct): Data View, high density; "avoid auto-play high-res video loops"; media loads
> lazily.

## Layout
- Toolbar: upload (drag and drop anywhere on the page, click, paste), search, filters (Photos, Videos, Unused), grid or
  list view. Tabs: Library · Site images (replaces Media slots).
- Grid tiles 4:3 with alt text under each; list view with size, uses and date.
- Details sheet (right): preview, Describe the photo, Photo credit (folded), sizes, where it is used (links), Replace
  everywhere, Delete (only when unused).

## Rules
- Type and size checked before upload (JPG, PNG, WebP, AVIF ≤ 12 MB; MP4/WebM ≤ 50 MB); per-file progress and retry.
- Videos never autoplay in the library: poster first, play on click.
- Alt text required; suggested from the record title in fields.
