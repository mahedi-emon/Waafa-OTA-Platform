# Editor overrides (WAAFA Admin)

> Overrides `../MASTER.md` for record and settings editors. Full spec: `docs/design/ADMIN.md` §5.4, §6, §7, §9.
> Generator output (19 Oct): UX rules applied — every input has a label, validate on blur, loading → success/error on
> submit, errors with a next step; shadcn rule "Form + FormField" applies to the small fixed forms (React Hook Form +
> zod), while record editors run on the SchemaEditor engine with blueprints (D187).

## Layout
- Section rail (left, sticky, check marks) · one form column ≤ 720 px · right rail 320 px from 1280 px (status,
  visibility, preview, publish checklist, SEO snippet, edited by, history, duplicate, trash).
- Sticky action bar: unsaved state and draft time, Discard, Save draft, Preview, Publish / Update; Ctrl/Cmd+S.
- Fields: label (14 px, 600), input 44 px / 16 px text, help 13.5 px mist-600 under the label, error under the input.

## Rules
- No internal names; nothing typed that the system knows (ids, links, dates, sizes, popularity, order).
- Advanced (fields outside the blueprint) only for the Super Admin, folded at the end.
- Unsaved-changes guard, autosaved draft restored after reload or sign-in, edit-conflict check on save.
- Best from 1024 px; usable at 768 px (rail moves to the top); readable at 390 px.
