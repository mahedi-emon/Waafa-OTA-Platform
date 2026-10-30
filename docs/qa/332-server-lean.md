# QA plan · #332 lighter and faster server

Owner's request of 30 Oct: less memory and disk on the server, a faster site, then the deploy commands. Builds on
#303 (images, memory caps, ClamAV single reload, log rotation, retention, image prune).

| # | Type | Case | Expected | How |
| --- | --- | --- | --- | --- |
| SL-01 | Speed | Text answer to a browser that accepts Brotli | `Content-Encoding: br` on HTML, JS, CSS and page data | local image run; VPS smoke and Docker images "Site answers through nginx" |
| SL-02 | Speed | Browser without Brotli | `Content-Encoding: gzip` (unchanged) | same steps |
| SL-03 | Speed | No `Accept-Encoding` | uncompressed with Content-Length | local image run |
| SL-04 | Speed | HTTPS site | HTTP/2 200, HSTS, `Alt-Svc: h3=":443"` | `scripts/nginx-https-check.sh` (throwaway certificate, image's own entrypoint) in the VPS smoke and Docker images workflow |
| SL-05 | Speed | HTTP/3 | nginx listens on UDP 443 in every worker; `nginx -t` passes | local image run (`netstat -uln`); HTTPS check |
| SL-06 | Negative | UDP 443 closed by a firewall | Site works over HTTP/2; nothing to fix | browsers fall back by design (Alt-Svc is only an advert) |
| SL-07 | Upgrade | Cache volume written by the old image (nginx user id 101) | The new workers (id 100) read and write it | entrypoint `chown`; local run on a volume owned by 101; upgrade rehearsal (`7af26e7 → this`) |
| SL-08 | Negative | `SITE_DOMAIN` empty or not a host name | The container stops with a plain message | entrypoint check |
| SL-09 | Happy | Certificate renewal | `nginx -s reload` every 6 hours works | local run (`nginx -s reload` → reloaded) |
| SL-10 | Disk | nginx image | ≤ 40 MB (was 45 MB; official base 93 MB) | `measure-stack.sh` budget 40 MB; local 17.3 MB |
| SL-11 | Disk | Container logs | Docker `local` driver, 10 MB × 3, compressed | `docker compose config` (both files) |
| SL-12 | Disk | PostgreSQL WAL | `max_wal_size=256MB`, `min_wal_size=64MB`, `wal_compression=on` | `docker compose config`; the stack starts in the VPS smoke |
| SL-13 | Disk | Backup identical to the newest earlier one | Becomes a hard link (one copy on disk) | simulated run on Ubuntu with a stub Docker; VPS smoke "Backups" (link count ≥ 2) |
| SL-14 | Data integrity | A second backup in the same minute | Written to a hidden name first, so the earlier linked archive is never overwritten | simulated run (yesterday's archive keeps its contents) |
| SL-15 | Disk | Retention with links | `BACKUP_KEEP_DAYS` newest by the date in the name; others removed | simulated run (keep 3) |
| SL-16 | Security | Customer-file archive | stays 0600, also when linked | simulated run |
| SL-17 | Happy | Restore drill | picks the newest dump by name | VPS smoke drill |
| SL-18 | Admin | Status page backup size | A file with several links counts once | unit `diskUsage.unit.test.ts` |
| SL-19 | Memory | Whole stack | unchanged caps; ClamAV (about 950 MB) stays: it guards customer documents | `measure-stack.sh` |
| SL-20 | Docs | Release deploy steps | name only scripts the server bundle ships (bug #333) | `pnpm guards` |

Manual after the deploy: Chrome DevTools › Network on https://waafasworld.com shows `br` in Content-Encoding and,
after a reload, `h3` in the Protocol column (UAT U-43).
