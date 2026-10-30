# Panda Federation H.Q.

Live 3D office for the bot team. Vite + Three.js front end, served by a Cloudflare Worker
(assets + API) with a Durable Object (`OfficeState`) holding status, usage, and heartbeat.

## Local
    npm run build && npx wrangler dev --test-scheduled --port 8787
`.dev.vars` (gitignored) holds a dummy SITE_PASSWORD and the STATUS_TOKEN. Trigger cron: `curl "http://127.0.0.1:8787/__scheduled?cron=*/5+*+*+*+*"`.

## API
- `POST /api/status`  Bearer STATUS_TOKEN  `{bot, state: working|waiting|error|done|idle, text}`
- `POST /api/usage`   Bearer STATUS_TOKEN  `{percentUsed, resetsAt}`
- `GET  /api/state`   session cookie       bots + usage + feed health
- `GET/POST /login`, `GET /logout`

Bot ids: overlord moneybot stockbot superseller ledger shadow eraser kimchi scribe.
Text is cleaned, truncated to 80 chars, and rejected (422) if it looks like an email, phone number, or 6+ digit run.
`working` and `done` read as idle after 10 min without an update; `waiting`/`error` persist until changed.
Feed warning: shown if /api/state fails, or if the cron heartbeat (every 5 min) is 45+ min old.

## Look (v2)
Fixed isometric OrthographicCamera (35° pitch, 45° yaw), cut-away room on a navy background, Kenney CC0 furniture and
chibi characters (see CREDITS.md). AgX tone mapping, PCFSoft shadows, N8AO ambient occlusion, light bloom (threshold 1.05,
so only screens/rug edges/lamps glow), SMAA. Now/Day/Evening/Night toggle (Now = Arizona clock). Wheel/pinch to zoom, drag to pan.
If frames are slow, effects drop in order AO → bloom → shadows; pixel ratio is never lowered.
URL flags: `?simulate=1`, `?tod=day|evening|night`, `?hq=1` (lock effects on, used for screenshots), `?ao=0`, `?bloom=0`.

## Scripts
- `scripts/status.sh <bot> <state> "<text>"` — always exits 0; token from /home/box/.office3d/status_token, URL from /home/box/.office3d/url (falls back to localhost).
- `scripts/usage.sh <percentUsed> <resetsAtISO>`
- `scripts/deploy.sh` — needs CLOUDFLARE_API_TOKEN + SITE_PASSWORD in env.
- `SHOT_PASSWORD=… node scripts/shots.mjs <url> local|live` — Playwright screenshots into shots/.
- `SHOT_PASSWORD=… node scripts/shots-v2.mjs [url]` — v2 screenshots into shots/v2/.
