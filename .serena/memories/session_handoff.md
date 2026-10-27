# Session handoff (update at every session end)
Updated 2026-10-27 Dhaka (usage limit hit mid-F1).
RULES: live site https://waafasworld.com, never touch the VPS; owner deploys `sh deploy.sh` after Docker images green
(`sh backup.sh` first when a PR has a migration). CI budget: normal PR quick set; `full-ci` for schema/deploy/auth/
payments/checkout/intake and PRs touching public pages (CI Lighthouse). Lighthouse (manual) is dispatch-only.
ORDER (owner 27 Oct, D300, TRACKER §14): 1) #276 flaky hero test; 2) letter F accounts + /track (email code via
Resend 6 digits/10 min/single use/5 tries or Google; no phone OTP/SMS sign-in) → checkpoint; 3) D, E, G, H, I, J, K,
#271, L, M, content readiness. QA rule every step (docs/qa first). Deadline 13 Nov.
NOW:
- PR #277 (#276, full-ci) open on fix/276-flaky-hero-task; 2nd push fixed the "Remove video Video" button name and
  uses e2e/hydration.ts whenHydrated(). Check CI; merge if green; close #276; Project Done.
- F1 #241 on feat/241-email-sign-in, pushed WIP dbcf9d0: migration 20261027090000_customer_sign_in (backup before
  deploy), shared email-code schemas + TEMPLATE_REQUIRED_VARIABLES, template customer-sign-in-code + seed patch,
  API CustomerCodesService (code/verify/complete), customerAuth.ts (attach by email, or phone when no email),
  AdminCustomerAccountsService (list/detail/disable/enable/sign-out-everywhere/attach, audited); API tests pass locally
  (API_TEST_DATABASE_URL=postgresql://waafa:waafa@localhost:5433/waafa_test). Web: /api/auth/email/{code,verify,
  complete}, sessionCookie.ts (session + readable hint cookie waafa_customer_hint + signup ticket cookie), EmailSignIn
  on /login, AccountLink in header/drawer/More sheet, lib/admin/customerAccountActions.ts. QA plan docs/qa/F-accounts.md.
- F1 LEFT: admin pages customers/accounts list + accounts/[id] (ActionButton for disable/enable/sign-out, attach form,
  messages Admin.customers.accounts.*), account card on the phone profile; web typecheck/lint/unit; API-mode e2e for
  code sign-in/up at 390 and 1440 + axe; TRACKER D301 + issue block; PRD_COVERAGE FR-ACC rows; PR with full-ci and the
  migration note.
NEXT: F2 #278 (My account sections, password), F3 #240 (/track), checkpoint F.
GOTCHAS: never `git stash pop`; commit headers ≤ 100 chars; Bash heredoc strips backslashes (write scripts with Write);
gh needs PATH += /c/Program Files/GitHub CLI; run Lighthouse with MSYS_NO_PATHCONV=1; record pages keep Suspense (D299).
