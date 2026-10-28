# QA plan · #303 lighter images, RAM and disk

Owner's decisions of 28 Oct (D312 item 3). Measured before and after; each case names how it is checked.

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| OP-01 | Size | API image | ≤ 400 MB (was 2.07 GB live, 1.82 GB on main) | local `docker images` (270 MB); `scripts/measure-stack.sh` budget in the VPS smoke and Docker images workflow |
| OP-02 | Size | Web image | ≤ 500 MB budget (was 571 MB live); owner target 250 MB not met, reason logged (D313) | same |
| OP-03 | Content | API image holds no TypeScript, tests, tsx, Prisma CLI or package manager | `find` finds no .ts/.test; no node_modules/prisma or typescript; dist/migrate.js present | Docker images workflow step "API image holds no source or tests" |
| OP-04 | Happy | Fresh database | `node dist/migrate.js` applies every migration; Prisma's `migrate status` then says up to date | API DB `applyMigrations.test.ts`; container run on a fresh database (16 applied, seed done) |
| OP-05 | Data integrity | Database migrated by Prisma (the live one) | Nothing re-applied; checksums equal Prisma's (SHA-256 of migration.sql) | API DB test; checksum table compared by hand; upgrade rehearsal from `7af26e7` |
| OP-06 | Negative | A migration fails | Rolled back in its transaction, nothing recorded, later ones not run, deploy stops | API DB test |
| OP-07 | Negative | A migration Prisma left failed | Deploy stops with the P3009 advice | API DB test |
| OP-08 | Happy | Native and file-reading packages in the image | sharp (WebP), argon2 (hash), pdfkit, bullmq load; worker connects | container run (`docker exec … import(...)`) |
| OP-09 | Happy | Upgrade from the live release | `7af26e7` stack with a lead and an order → this release → nothing lost, migrations finished | `scripts/upgrade-rehearsal.sh` (LIVE_RELEASE = 7af26e7) in the VPS smoke |
| OP-10 | Memory | Every container after the smoke, ClamAV loaded | Whole stack ≤ 3 GB, each under its limit | `measure-stack.sh` (`docker stats`) |
| OP-11 | Memory | ClamAV reload | `ConcurrentDatabaseReload no` in clamd.conf (one signature set) | env `CLAMD_CONF_…` checked in the image's /init (supported); smoke scans EICAR after it |
| OP-12 | Disk | Logs | json-file, 10 MB × 3 per container | `docker compose config` (both files) |
| OP-13 | Disk | Backups | `BACKUP_KEEP_DAYS` (default 7) of each kind, compressed | VPS smoke backup step; shell syntax check |
| OP-14 | Disk | Images after deploy | Unused images older than a week removed; Docker Hub keeps 10 releases and always LIVE_RELEASE | deploy.sh; `dockerhub-cleanup.mjs --protect` |
| OP-15 | Disk | Caches | nginx cache ≤ 600 MB (existing), Next image cache ≤ 512 MB (`maximumDiskCacheSize`) | config review |
| OP-16 | Admin | Status page disk use | Database, photos, customer files, backups sizes; cache caps shown; release and commit | API DB `status.test.ts` (sizes, Travel sales 403); unit `diskUsage` |
| OP-17 | Security | Backups folder in the API container | Mounted read only; customer-file backups stay 0600 | compose review |
| OP-18 | Labels | Every image | `org.opencontainers.image.revision` set | `measure-stack.sh` fails without it |
| OP-19 | Front end | Public first-load JS | ≤ 200 KB on every route (unchanged) | budget e2e |
| OP-20 | Front end | Admin first-load JS | Lists ≈ 306 KB, editors 380–400 KB (heavy parts already load on use); further split with #257 | build-manifest count (`docs/TRACKER.md` #303) |

Roles: the Status page stays Admin and Super Admin only (OP-16). Accessibility: the new "What fills the disk" section
is a definition list under its own h2, covered by the admin-screens axe sweep.
