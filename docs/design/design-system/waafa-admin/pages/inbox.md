# Inbox overrides (WAAFA Admin)

> Overrides `../MASTER.md` for leads, visa applications, orders, payment proofs and feedback. Full spec:
> `docs/design/ADMIN.md` §5.5 and §8. Generator output (19 Oct): Data View, high density; "preserve navigation history"
> (Back must work between list and detail on phones).

## Layout
- Desktop: list 380–440 px (resizable) + detail panel; phone: list → full-screen detail with a sticky bottom action bar.
- Detail order: header (name, reference, status chip with reason, reply timer) → next actions as buttons → labelled
  facts → customer card (other leads and orders) → timeline.
- Leads board: columns by status; drag runs the same transitions and asks for the same inputs; a "Move to…" menu for
  keyboards and phones.

## Rules
- Status changes only through actions (Call, WhatsApp, Email, Log quote, Ask for documents, Convert to booking, Close
  lead, Verify, Reject, Ship…); each writes the audit log and the timeline.
- Every job completes at 390 px with 44 px targets; contact actions are within thumb reach.
- New items arrive by polling every 30 s with a quiet badge, never a page jump.
