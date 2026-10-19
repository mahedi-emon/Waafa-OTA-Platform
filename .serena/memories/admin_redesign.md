# D0 Admin redesign (epic #201, owner top priority from 19 Oct 2026)
Plan and rules: docs/design/ADMIN.md (supersedes Admin*.dc.html boards, D183); design system
docs/design/design-system/waafa-admin/ (MASTER.md + pages dashboard, list-table, editor-form, media-library, inbox).
Issues (one PR each, in order): R0 #190 audit+ADMIN.md, R1 #191 shell/design system/sign-in, R2 #192 form engine v2
(blueprints in apps/web/src/lib/admin/blueprints/, widgets, action bar, right rail, autosave, History, Duplicate,
conflicts), R3 #193 media (MediaField/GalleryField/VideoField, crop+focal, library v2, video route + nginx limit),
R4 #194 status automation (packages/shared/src/workflow/, API enforcement, migrations, scheduler, Trash, redirects,
Sample auto-clear), R5 #195 DataTable v2 everywhere, R6 #196 inbox (leads list/board/detail, visa applications,
orders, proofs matching), R7 #197 website builder (home sections, menus, scheduling, draft preview, Edit on site),
R8 #198 purpose-built editors, R9 #199 dashboard/settings/users/audit/notifications/reports, R10 #200 QA + 14 staff
task e2e + docs/ADMIN_GUIDE.md (Banglish).
Checkpoints (Banglish summary + screenshot paths + "test this yourself"): after R0, R1, R3, R6, R8.
R1 notes: AdminFrame wraps TooltipProvider (the registry sidebar has none: a Tooltip without it crashes SSR);
Ctrl K dialog and the bell list/phone sheet load on first use (next/dynamic); sidebar link counts via aria-label;
e2e gestures need `until()` retry (hydration is slow on this machine); `getByLabel("Password", { exact: true })`.
R2 notes (branch feat/192-form-engine): blueprints in apps/web/src/lib/admin/blueprints/<group>.ts + registry.ts
(D193), plain data; words in Admin.blueprints/fieldNames/fieldHelp/choices resolved by resolveBlueprint (server) →
ResolvedBlueprint prop (D194); patterns = field names joined by "_", list items "<list>_item". Editor shell
components/admin/editor/ContentEditor (useEditorState: drafts in localStorage, leave guard, Ctrl S via #editor-save,
conflict dialog, session store) on components/admin/schema/* widgets (SchemaField dispatch). Messages for the editor go
through a scoped provider (EDITOR_MESSAGES). blueprints.test.ts proves coverage + plain labels. API: history/restore/
duplicate/options + list order owned by the list (#205). Guards flag "#205"-like issue refs as hex colours in
apps/web/src: write "issue 205". dnd-kit loads after hydration (SortableList → lazy SortableDnd).
R2 rules found in review: a section's ONE field named like the section has an sr-only label (useQuietLabel via
SectionLabelContext from EditorSection); multi-field sections must not share a name with a field (blueprints.test.ts
"names a field like its section only…"); statusOf returns "direct" (chip Live, "Changes show on the site as soon as
you save") for settings/lists without workflow or show switch; never remount editors with key={version} (state syncs
to a new server version in useEditorState); toasts repeat text, so e2e waits for the first one to hide.
Key decisions: D184 sidebar stays midnight-950; D185 status families info/progress/success/warning/danger/neutral,
new tokens sky-50 #ECF6FE, sky-700 #00459C, success-700 #005836, warning-800 #8C4A00, danger-700 #AF120D;
D186 21st.dev picks (ADMIN.md §14; free tier = 2 installs/day); D187 SchemaEditor stays the engine (no fork),
RHF only for fixed forms, URLs stay /content/[key] + new /website/home, /website/menus, /visa-applications,
/settings/[section].
Stored statuses keep their values (lead pending = "Waiting for customer", order processing = "Packing");
content adds "scheduled". Migrations additive; remind owner `sh backup.sh` before deploy when a PR adds one.
Tools not loaded in VS Code session: design-superpowers, 21st-ui, ui-color-palette plugins are synced at
~/.claude/plugins/synced/55330c7b-…/ (d9cd42a0… = design-superpowers, 3d3808fa… = 21st, 286a5c21… = ui-color-palette);
read SKILL.md from disk; ui-color-palette MCP https://mcp.ui-color-palette.com/mcp works via a JSON-RPC client.
