# QA plan: #239 backups, restore drill, off-site copy, alerts, lead limit, CSP, staging

Owner's order of 28 Oct, step 5.

| ID | Area | Type | Preconditions | Steps | Expected result | Priority | Automated by |
| --- | --- | --- | --- | --- | --- | --- | --- |
| B-01 | Cron | Happy | Fresh server | `sh deploy.sh` | crontab has the 03:15 backup and the 1st-of-month drill, marked waafa-backup; running deploy again does not duplicate them | P0 | VPS smoke (ci.yml) |
| B-02 | Cron | Edge | `BACKUP_CRON=off` in .env | `sh deploy.sh` | crontab untouched | P1 | manual |
| B-03 | Backup | Happy | Stack running | `sh backup.sh` | dump, photos and customer files in backups/, 14 of each kept, customer files readable by the owner only | P0 | VPS smoke |
| B-04 | Drill | Happy | A backup exists | `sh backup.sh --drill` | "drill ok" with row counts; the throwaway database is gone afterwards | P0 | VPS smoke |
| B-05 | Drill | Negative | An empty or broken dump | `--drill` | "drill failed", exit 1, the line lands in drill.log | P1 | manual |
| B-06 | Off-site | Happy | R2 or B2 card On | `sh backup.sh` | Each file under backups/ in the bucket; log says "Off-site copy ok" | P0 | unit (SigV4) + UAT |
| B-07 | Off-site | Edge | No storage card On | `sh backup.sh` | "Off-site copy off", backup still succeeds | P0 | VPS smoke |
| B-08 | Off-site | Negative | Wrong key | `sh backup.sh` | "off-site copy failed", the local copy is kept, backup succeeds | P1 | manual |
| B-09 | Alerts | Happy | Disk under 10 % or 2 GB free, or memory under 5 % | Wait ten minutes | One email (template system-alert-staff) to the "system" recipients or STAFF_ALERT_EMAIL, at most every six hours per problem | P1 | `resourceAlert.unit.test.ts` + manual |
| B-10 | Lead limit | Security | — | Six lead submits from one address in a minute | The sixth is refused with the plain "try again" message (web 5, API 10) | P0 | API `rateLimit.test.ts`; web limiter unit |
| B-11 | CSP | Security | — | Read the response headers | CSP as documented in SECURITY.md (no nonce, documented exception) | P1 | headers unit tests |
| B-12 | Staging | Happy | A second VPS | Follow deploy/staging/README.md | Own database, Sample content, Cloudflare Access in front, test keys only | P2 | manual (owner's choice) |
