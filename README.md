# Panda Federation H.Q.

Live 3D headquarters for the Panda Federation bot team — a cut-away office tower with status chips, apartments one floor down, and a day/night Arizona clock.

## Use

Open the live office: **https://panda-federation-hq.pandafederation.workers.dev**

(Password-gated. Bot status and usage update from the team; visitors browse the scene.)

## Local run

```bash
npm install
npm run dev
```

That builds the Vite front end and starts Wrangler on http://127.0.0.1:8787 (`--test-scheduled --port 8787`).

Create a gitignored `.dev.vars` next to `wrangler.toml` with dummy values for local secrets (names only — never commit real values):

```
SITE_PASSWORD=dev-password
STATUS_TOKEN=dev-token
```

Trigger the cron heartbeat locally:

```bash
curl "http://127.0.0.1:8787/__scheduled?cron=*/5+*+*+*+*"
```

Production secrets are set with `wrangler secret put` (see `wrangler.toml`); they are never stored in this repo.

## For developers

### Stack

Vite + Three.js front end, Cloudflare Worker (static assets + API) with a Durable Object (`OfficeState`) for status, usage, and heartbeat.

### API overview

Auth names only — set real values via Wrangler secrets / local `.dev.vars`, never in git:

- `POST /api/status` — Bearer `STATUS_TOKEN` — `{bot, state: working|waiting|error|done|idle, text}`
- `POST /api/usage` — Bearer `STATUS_TOKEN` — `{percentUsed, resetsAt}`
- `GET /api/state` — session cookie — bots + usage + feed health
- `GET/POST /login`, `GET /logout`

Bot ids: `overlord` `moneybot` `stockbot` `superseller` `ledger` `shadow` `eraser` `kimchi` `scribe` `planner` `mini`.

Text is cleaned, truncated to 80 chars, and rejected (422) if it looks like an email, phone number, or 6+ digit run. `working` and `done` read as idle after 10 min without an update; `waiting`/`error` persist until changed. Feed warning: shown if `/api/state` fails, or if the cron heartbeat (every 5 min) is 45+ min old.

Helper scripts (`scripts/status.sh`, `scripts/usage.sh`) read a token file and office URL from `$OFFICE3D_HOME` (default `~/.office3d`) or env overrides — paths only, no secrets in the repo. Screenshots: `SHOT_PASSWORD=… node scripts/shots*.mjs …` (password from env).

### Look notes

**v2** — Fixed isometric OrthographicCamera (35° pitch, 45° yaw), cut-away room on a navy background, Kenney CC0 furniture and chibi characters (see CREDITS.md). AgX tone mapping, PCFSoft shadows, N8AO ambient occlusion, light bloom (threshold 1.05), SMAA. Now/Day/Evening/Night toggle (Now = Arizona clock). Wheel/pinch to zoom, drag to pan. If frames are slow, effects drop in order AO → bloom → shadows; pixel ratio is never lowered. URL flags: `?simulate=1`, `?tod=day|evening|night`, `?hq=1`, `?ao=0`, `?bloom=0`.

**v3** — Office mid-way up a glass tower: facade with floors below (lit window glimpses), distant skyline on a hazy city ground, framed-glass partitions with doorways per department, gym corner. Each bot’s chibi is restyled after its profile picture. Seated poses sit on cushions (`SEAT_FIT` in `src/main.js`).

**v4** — Frosted-glass restroom west of the gym (two stalls, vanity with sinks and mirror), walkway to gym and break room. Glass elevator beside the front desk; floor arrow (bottom left) or elevator click peels the office layer back to the apartment floor: 11 studios, one per bot, color + name mat. Idle bots roam lounge / coffee bar / break-room table / restroom (capped 4/4/2). From **2:00–7:00 AM Arizona time** every bot rides down and sleeps in its own bed; status chips stay real. Screenshot flags: `?floor=apt`, `?sleep=1|0`.

### Credits

Kenney CC0 models and library licenses: see [CREDITS.md](CREDITS.md). Crest artwork is Sean’s own.

This package stays `"private": true` — it is not published to npm.
