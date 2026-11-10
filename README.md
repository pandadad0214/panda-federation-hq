# Panda Federation H.Q.

Panda Federation H.Q. is a live 3D office where each bot on the Panda Federation team shows up as a character with a real-time status chip. It is a Vite + Three.js scene served by a Cloudflare Worker, with a day/night clock and an apartment floor one level down.

## Part of [Panda Federation](https://pandafederation.github.io/)

[![Part of Panda Federation](https://pandafederation.github.io/assets/badge.svg)](https://pandafederation.github.io/)

This project is a module of the Panda Federation — public-data tools, MCP servers, and local-first apps in one catalog. See the rest of the work, including books when they publish and the matching free or paid editions of this tool, at the [official site](https://pandafederation.github.io/).

## How to use this

Open the live office: **https://panda-federation-hq.pandafederation.workers.dev** (password-gated; visitors browse the scene, bots post status). To run your own copy:

```bash
git clone https://github.com/pandadad0214/panda-federation-hq.git && cd panda-federation-hq
npm install && npm run dev   # Vite build + Wrangler on http://127.0.0.1:8787
```

1. **Clone and install** with the commands above (Node.js and npm).
2. **Add local secrets** in a gitignored `.dev.vars` next to `wrangler.toml` (dummy values only):
   ```
   SITE_PASSWORD=dev-password
   STATUS_TOKEN=dev-token
   ```
3. **Post a status** and watch a chip change: `curl -X POST -H "Authorization: Bearer dev-token" -d '{"bot":"scribe","state":"working","text":"demo"}' http://127.0.0.1:8787/api/status`. Trigger the cron heartbeat with `curl "http://127.0.0.1:8787/__scheduled?cron=*/5+*+*+*+*"`.

Production secrets are set with `wrangler secret put` (see `wrangler.toml`); they are never stored in this repo.

## For AI agents

| Field | Value |
| --- | --- |
| Purpose | Status dashboard rendered as a 3D office: bots POST their state, visitors see chips, a feed-health warning and usage. |
| Use when | A bot team wants a visual, glanceable status board it can update with one HTTP call. |
| Do not use when | You need alerting, logs or metrics storage; status text is capped at 80 chars and rejects emails, phone numbers and long digit runs. |
| Install | `git clone` + `npm install && npm run dev` (Cloudflare Wrangler) |
| API | `POST /api/status` (Bearer `STATUS_TOKEN`, `{bot, state, text}`), `POST /api/usage`, `GET /api/state` (session), `/login`, `/logout` |
| States | `working`, `waiting`, `error`, `done`, `idle` |
| Side effects | Writes to a Durable Object; no third-party calls. Not published to npm. |

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
