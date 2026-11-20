# Portfolio API (Cloudflare Worker + D1 + KV)

Backend for the portfolio website (`app/web`) and the admin panel (`app/admin`).
Both frontends stay on Vercel; this Worker replaces the old Express/Postgres server in `app/server`.

Live URL: `https://portfolio-api.teerathpant2.workers.dev`

## Architecture

```
Browser (Vercel: portfolio + admin)
        |  HTTPS, CORS allow-list, Bearer token for admin routes
        v
Cloudflare Worker  (Hono, TypeScript)
   |-- D1 (SQLite)   all portfolio content, feedback, analytics
   |-- KV  (IMAGES)  uploaded image bytes
   `-- Rate Limit bindings (login, feedback, track)
```

- No browser ever talks to D1 or KV directly. Everything goes through this API.
- Public site and admin both use one document-style contract: `GET /api/load` returns the whole portfolio, `POST /api/save` replaces it.
- Images are never stored in D1. D1 only holds the URL (`/api/img/<id>`), KV holds the bytes.

Source layout:

| File | Purpose |
|---|---|
| `src/index.ts` | app, CORS, route mounting, error handlers |
| `src/auth.ts` | login, PBKDF2 password check, JWT, `requireAdmin` middleware |
| `src/portfolio.ts` | `GET /api/load`, `POST /api/save` (validation with Zod) |
| `src/feedback.ts` | visitor reviews |
| `src/analytics.ts` | track + dashboard stats |
| `src/images.ts` | upload, serve, unused-image cleanup |
| `src/db/schema.ts` | Drizzle schema (source of the migrations) |
| `migrations/` | SQL applied by `wrangler d1 migrations apply` |
| `scripts/set-password.mjs` | creates the admin password hash |
| `scripts/smoke.mjs` | API smoke test (local or production) |

## Database schema (D1 / SQLite)

Content tables keep admin ordering in a `position` column.

| Table | Columns (besides `id`) |
|---|---|
| `portfolio_profile` (single row, id=1) | name, title, location, headline, subtext, available_for_work, avatar_url, updated_at |
| `portfolio_goals`, `portfolio_audience`, `portfolio_future_enhancements` | position, text |
| `portfolio_bio_points` | position, icon, label, value |
| `portfolio_projects` | position, title, description, tag, link, images (JSON array of URLs), show_on_home, created_at, updated_at |
| `portfolio_skill_levels` | position, label, value (0-100) |
| `portfolio_technical_mastery` | position, title, icon, skills (JSON array) |
| `portfolio_socials` | position, label, href, platform |
| `portfolio_stats` | position, value, label |
| `feedback` | rating (1-5), comment, name, date, created_at; index on date |
| `contact_messages` | name, email, message, read, notified and confirmation (email results: `sent`, `failed: ...`, `skipped: ...`), created_at; index on created_at |
| `visits` | date, hashed_ip, session, country, page, created_at; index on date |
| `events` | type, project, platform, session, date, created_at; index on date |
| `settings` | key (PK), value, updated_at. Keys: `ignoredIpHash`, `portfolioVersion` |

Design notes:
- There is no admin table. The single admin's password hash is a Worker secret.
- `portfolioVersion` is a random id rewritten on every save. It is the ETag of `GET /api/load`.
- `hashed_ip` is an HMAC-SHA256 keyed with `AUTH_SECRET`. Raw IPs are never stored.
- Old `/api/save` replaced everything non-atomically. Now the whole save is one D1 batch (a transaction).

## API

All responses are JSON `{ ok: boolean, ... }`. Errors: `{ ok: false, error: "..." }`.

### Public

| Method + path | Body / notes |
|---|---|
| `GET /` | health check |
| `GET /api/load` | whole portfolio. `{ ok, data }`, `data` is `null` until the first save (frontends then use their built-in defaults). Sends `ETag` and `Cache-Control: no-cache`; a matching `If-None-Match` returns `304` after one DB read |
| `POST /api/admin/login` | `{ password }` returns `{ ok, token }`. Token is valid 12 hours. 5 attempts per minute per IP |
| `POST /api/feedback` | `{ rating: 1-5, comment?: <=2000, name?: <=100 }`. 3 per minute per IP |
| `POST /api/contact` | `{ name <=100, email (valid, <=200), message <=5000 }`. Saves the message, then emails the owner (see below). 3 per minute per IP |
| `POST /api/track` | `{ event: "pageview" \| "project_view" \| "contact_click", page?, session?, project?, platform? }`. 30 per minute per IP |
| `GET /api/img/:id` | image bytes, `Cache-Control: public, max-age=31536000, immutable` |

### Admin (header `Authorization: Bearer <token>`; otherwise `401`)

| Method + path | Notes |
|---|---|
| `POST /api/save` | whole document, max 1 MB. Rejects `data:` image URLs. Afterwards deletes uploaded images that nothing references (and are older than 1 hour) |
| `POST /api/upload` | raw image bytes as body. PNG/JPEG/GIF/WebP only (checked from the file's first bytes, SVG is refused), max 10 MB. Returns `{ ok, url: "/api/img/<id>" }` |
| `GET /api/feedback` | newest 500, `no-store` |
| `DELETE /api/feedback` | delete all |
| `GET /api/contact` | newest 200 contact messages, `no-store` |
| `POST /api/contact/:id/read` | `{ read: boolean }` |
| `DELETE /api/contact/:id` | delete one message |
| `GET /api/analytics?range=today\|7d\|all` | aggregated in SQL, `no-store` |
| `POST /api/analytics/ignore-self` | `{ action: "ignore" \| "allow" }` |
| `DELETE /api/analytics` | delete all visits and events |

## Environment variables and secrets

| Name | Kind | Where it is set |
|---|---|---|
| `ALLOWED_ORIGINS` | plain variable, comma-separated | `wrangler.jsonc` `vars` |
| `ADMIN_PASSWORD_HASH` | secret | prod: `wrangler secret put`; local: `.dev.vars` |
| `AUTH_SECRET` | secret (signs tokens, keys the IP hash; use a long random string) | prod: `wrangler secret put`; local: `.dev.vars` |
| `DB` | D1 binding | `wrangler.jsonc` |
| `IMAGES` | KV binding | `wrangler.jsonc` |
| `LOGIN_LIMITER`, `FEEDBACK_LIMITER`, `TRACK_LIMITER`, `CONTACT_LIMITER` | rate limit bindings | `wrangler.jsonc` `ratelimits` |
| `CONTACT_TO_EMAIL` | plain variable: where contact messages are emailed | `wrangler.jsonc` `vars` |
| `SMTP_USER`, `SMTP_PASS` | secrets: SMTP login (Gmail app password). With both set, SMTP sends all contact mail | prod: `wrangler secret put` |
| `SMTP_HOST`, `SMTP_PORT`, `SITE_URL`, `ADMIN_URL`, `CONTACT_FROM_NAME` | plain variables for the contact emails | `wrangler.jsonc` `vars` |
| `RESEND_API_KEY` | secret, optional fallback when SMTP is not set. Without any mail setup, messages are still saved and shown in the admin panel, just not emailed | prod: `wrangler secret put` |

Frontends (Vercel, build-time variables):

| App | Variable | Value |
|---|---|---|
| portfolio (`app/web`) | `VITE_API_URL` | Worker URL, no trailing slash |
| admin (`app/admin`) | `VITE_API_URL` | Worker URL, no trailing slash |
| admin (`app/admin`) | `VITE_WEB_URL` | `https://teerath-portfolio.vercel.app` |

Vite bakes these in at build time, so redeploy after changing them. Locally they live in `app/web/.env.local` and `app/admin/.env.local` (git-ignored) and point to `http://127.0.0.1:8787`.

Never put Cloudflare tokens, the hash or `AUTH_SECRET` in a `VITE_` variable: those are shipped to every browser.

`.dev.vars`, `.env*` and `.wrangler/` are git-ignored. Do not commit them. Do not add `"remote": true` to a binding in `wrangler.jsonc`, it makes `wrangler dev` use production data.

## Local development

```bash
cd app/worker
npm install
npm run set-password                # asks for the admin password (hidden), writes .dev.vars
npm run db:migrate:local            # creates the local D1 tables
npm run dev                         # http://127.0.0.1:8787
```

In other terminals run the apps from the repo root: `npm run dev:web` (port 5000) and `npm run dev:admin` (port 5001).

Checks:

```bash
npm run typecheck
# PowerShell
$env:BASE="http://127.0.0.1:8787"; $env:ADMIN_PASSWORD='your-password'
node scripts/smoke.mjs --full       # --full writes sample data: LOCAL ONLY
```

Without `--full` the smoke test is read-only and safe against production.

## Deploy to Cloudflare (first time)

Run everything in `app/worker`.

```bash
npx wrangler login
npx wrangler d1 create portfolio-db            # put database_id into wrangler.jsonc
npx wrangler kv namespace create IMAGES        # put id into wrangler.jsonc
npx wrangler d1 migrations apply DB --remote
npx wrangler deploy
npx wrangler secret put ADMIN_PASSWORD_HASH    # paste the hash printed by set-password
npx wrangler secret put AUTH_SECRET            # long random string, not the local one
```

When wrangler offers to "add the binding on your behalf", decline or check `wrangler.jsonc` afterwards: it may add a duplicate binding and `"remote": true`.

Then set the Vercel variables above and redeploy both Vercel projects.

Test production (read-only):

```powershell
$env:BASE="https://portfolio-api.teerathpant2.workers.dev"
$env:ADMIN_PASSWORD='your-password'
node scripts/smoke.mjs
Remove-Item Env:ADMIN_PASSWORD
```

## Contact form and email

A visitor's message is saved in D1 first (shown in the admin panel under **Messages**), then emailed after the response is sent, so a slow or failing mail service never fails the visitor's submit. The outcome is stored on the message (`notified` = mail to you, `confirmation` = mail to the visitor) and shown as badges in the admin panel.

Two mail providers are supported; SMTP wins when its credentials exist:

| | Mail to you | Confirmation to the visitor |
|---|---|---|
| **SMTP** (`SMTP_USER` + `SMTP_PASS` set), e.g. Gmail | yes | yes, no domain needed |
| **Resend** (`RESEND_API_KEY` set, no SMTP) | yes, only to the Resend account's own address while sending from `onboarding@resend.dev` | no |

### SMTP setup (Gmail)

1. Use a **separate Gmail account just for sending** (not your main one). The contact form is public: if it were ever abused, only this throwaway mailbox is at risk.
2. In that account turn on 2-Step Verification, then create an app password (Google Account, Security, App passwords). Google: app passwords need 2-Step Verification, are revoked when the account password changes, and are "not recommended" in general; treat the password as full access to that mailbox.
3. Set the secrets (type the value at the prompt, never put it in the command):
   ```bash
   npx wrangler secret put SMTP_USER   # the sending Gmail address
   npx wrangler secret put SMTP_PASS   # the app password, without spaces
   ```
4. `npx wrangler deploy`. Defaults are `smtp.gmail.com` port `465` (implicit TLS), set in `wrangler.jsonc` vars (`SMTP_HOST`, `SMTP_PORT`).
5. Send a test message from the site. If a badge says `failed`, hover it: the stored text is the server's reply (credentials are never stored).

### What gets sent

- **To you** (`CONTACT_TO_EMAIL`): branded HTML email with the visitor's name, email, time and message, a Reply button, and `Reply-To` set to the visitor.
- **To the visitor:** short "Thanks, <first name>! I received your message" email. It contains **none of the visitor's message text** (only their first name), `Reply-To` is your real inbox, so a reply reaches you even though SMTP sends from the separate account.
- Both have a plain-text part. Everything a visitor typed is HTML-escaped.
- Edit the look in `src/emailTemplate.ts` and run `npm run preview-email` to write `email-preview.html` and `email-preview-visitor.html` (git-ignored) without sending anything.

### Abuse protection

- Per IP: 3 messages per minute (`CONTACT_LIMITER`).
- At most 30 messages per UTC day trigger emails; later ones are still saved, just not emailed.
- A visitor address gets at most one confirmation per 24 hours, so the form cannot be used to keep mailing someone else's address.

### Limits and unknowns

- Resend free plan, per its pricing page: 3,000 emails per month and 100 per day. Check [resend.com/pricing](https://resend.com/pricing) for the current numbers and whether signup asks for a card; the docs I read do not say.
- Gmail's own daily sending limit for personal accounts was not stated in the pages checked. Keep volume low.
- SMTP uses Workers TCP sockets (`cloudflare:sockets`, port 25 is blocked, 465/587 are not listed as blocked). Cloudflare's page does not say whether the Free plan allows them; this is confirmed only by a real send after deploy.
- SMTP uses the third-party `worker-mailer` package (MIT). It was tested here against a local mock SMTP server, not against real Gmail.

## Common tasks

- **Change the admin password:** `npm run set-password`, then `npx wrangler secret put ADMIN_PASSWORD_HASH` and paste the new hash. No redeploy needed. Existing tokens stay valid until they expire (12 h); rotate `AUTH_SECRET` to invalidate them at once.
- **Change the database schema:** edit `src/db/schema.ts`, `npm run db:generate`, then `npm run db:migrate:local` and `npx wrangler d1 migrations apply DB --remote`.
- **Add a frontend domain:** add it to `ALLOWED_ORIGINS` in `wrangler.jsonc` and run `npx wrangler deploy`.
- **View production logs:** `npx wrangler tail`.

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Could not detect a directory containing static files` | `wrangler` was run outside `app/worker`. `cd` into it |
| `D1 binding 'DB' references database '0000...' which was not found` | `database_id` in `wrangler.jsonc` is still the placeholder |
| Login returns `Admin login is not configured` | `ADMIN_PASSWORD_HASH` or `AUTH_SECRET` secret missing (prod) or `.dev.vars` missing (local) |
| Login returns `Incorrect password` for the right password | the hash in the secret differs from the password you type. Re-run `set-password` and `secret put` again |
| Login returns `429` | rate limit, wait a minute |
| Browser shows a CORS error | the page's exact origin (scheme + host, no path) is not in `ALLOWED_ORIGINS`; also check `VITE_API_URL` has no trailing slash |
| Admin or site calls `localhost:5002` | `VITE_API_URL` was not set in Vercel, or the project was not redeployed after setting it |
| Admin save says `Images must be uploaded through /api/upload...` | an old `data:` image is in the draft. Re-upload that image |
| `Worker exceeded CPU time limit` (error 1102) on login | PBKDF2 is the only heavy step (100,000 iterations). It passed on the free plan; if it ever fails, lower the iteration count in `set-password.mjs`, regenerate the hash and update the secret |
| Error 1027 | the daily request limit was reached (see below) |
| Message shows `email failed: HTTP 403` / `skipped: email not configured` in admin | `RESEND_API_KEY` missing or wrong, or the Resend account email differs from `CONTACT_TO_EMAIL` (test sender only delivers to the account owner). Messages are never lost, they are in the Messages tab |
| Uploaded image disappeared | it was unreferenced after a save and older than 1 hour. Re-upload and press Save & Apply |

## Free-tier limits

Figures below were read from Cloudflare's documentation on 2026-11-20 for the **Free** plan. Cloudflare can change them; check the current pages before relying on them:
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) and [D1 limits](https://developers.cloudflare.com/d1/platform/limits/),
[KV pricing](https://developers.cloudflare.com/kv/platform/pricing/) and [KV limits](https://developers.cloudflare.com/kv/platform/limits/).
This is not a promise of free hosting. Nothing in this project enables a paid plan; upgrading would be a manual action in your Cloudflare dashboard.

| Service | Free allowance | How this project touches it |
|---|---|---|
| Workers requests | 100,000 per day (UTC), then error 1027 | every API call, including the website's pageview tracking |
| Workers CPU time | 10 ms per request | login (password hashing) is the heaviest call |
| Workers request body | 100 MB | uploads are capped at 10 MB by this API |
| D1 rows read | 5 million per day | `/api/load` reads one row when the ETag matches |
| D1 rows written | 100,000 per day | each pageview/event is one row; a save rewrites the content tables |
| D1 storage | 5 GB per account, 500 MB per database | content + analytics rows (no images) |
| D1 row / string size | 2 MB | why images are not stored in D1 |
| D1 per query | 100 bound parameters, 100 KB SQL, 50 queries per invocation | saves are chunked; a batch counts as one query |
| KV reads | 100,000 per day | one per image view that misses the browser cache |
| KV writes / deletes / lists | 1,000 per day each | one write per upload; one list per full save (image cleanup) |
| KV storage | 1 GB; max value 25 MiB | uploaded images |
| Rate limit binding | the docs do not state a plan restriction; it deployed and works on this account | per-location, approximate and eventually consistent, so it is a deterrent, not an exact cap |

If a daily limit is exceeded, further calls of that type fail until midnight UTC. Analytics `DELETE` and old-visit pruning are manual; old `visits`/`events` rows are kept until you clear them.

The docs I read do not say whether a payment method is required for the Free plan. In this project's setup the account was created, and the Worker, D1 and KV were deployed, without a card being asked for.

## Security notes

- Admin password: PBKDF2-SHA256, 100,000 iterations (the Workers maximum), constant-time comparison. Only the hash is stored, as a secret.
- Tokens: HS256 JWT, 12 hour expiry, sent as `Authorization: Bearer` (no cookies, so no CSRF surface).
- Input: every body is validated with Zod; database access uses bound parameters only (Drizzle).
- CORS is a browser-side restriction only; the real protection of admin routes is the token.
- Uploads: file type is decided from the file's first bytes; SVG is refused; ids are random UUIDs.
- Public endpoints are throttled per IP by the rate limit bindings.
