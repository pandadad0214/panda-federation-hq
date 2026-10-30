// Panda Federation H.Q. — Worker + Durable Object
// Auth: /login sets an HttpOnly HMAC-signed session cookie. Everything else needs it,
// except bot push endpoints which use the STATUS_TOKEN bearer.

const BOTS = ['overlord', 'moneybot', 'stockbot', 'superseller', 'ledger', 'shadow', 'eraser', 'kimchi', 'scribe', 'planner'];
const STATES = ['working', 'waiting', 'error', 'done', 'idle'];
const STALE_MS = 10 * 60 * 1000;          // working/done -> idle after 10 min with no update
const QUIET_WARN_MS = 45 * 60 * 1000;     // feed "quiet" warning threshold
const SESSION_DAYS = 30;
const COOKIE = 'hq_session';

const enc = new TextEncoder();
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hmacKey(env) {
  const seed = await crypto.subtle.digest('SHA-256', enc.encode('hq-session-v1:' + (env.SESSION_SECRET || '') + ':' + env.SITE_PASSWORD));
  return crypto.subtle.importKey('raw', seed, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function sign(env, payload) {
  return b64url(await crypto.subtle.sign('HMAC', await hmacKey(env), enc.encode(payload)));
}
function timingSafeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  let d = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) d |= (a.charCodeAt(i) | 0) ^ (b.charCodeAt(i) | 0);
  return d === 0;
}
async function makeSession(env) {
  const exp = Date.now() + SESSION_DAYS * 864e5;
  return `${exp}.${await sign(env, 'exp:' + exp)}`;
}
async function validSession(env, req) {
  const m = (req.headers.get('Cookie') || '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=([^;]+)`));
  if (!m) return false;
  const [exp, sig] = m[1].split('.');
  if (!exp || !sig || +exp < Date.now()) return false;
  return timingSafeEq(sig, await sign(env, 'exp:' + exp)) ? +exp : false; // expiry (ms) when valid
}
const sessionCookie = (v) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
function bearerOk(env, req) {
  const h = req.headers.get('Authorization') || '';
  return !!env.STATUS_TOKEN && h.startsWith('Bearer ') && timingSafeEq(h.slice(7).trim(), env.STATUS_TOKEN);
}

const json = (obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra },
});
const SEC_HEADERS = { 'x-frame-options': 'DENY', 'referrer-policy': 'no-referrer', 'x-content-type-options': 'nosniff' };

// Privacy screen for status text
const RX_EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const RX_PHONE = /(\+\d[\d\s().-]{8,}\d)|(\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b)/;
const RX_DIGITS = /\d{6,}/;
function cleanText(raw) {
  if (raw == null) return { text: '' };
  if (typeof raw !== 'string') return { error: 'text must be a string' };
  if (raw.length > 1000) return { error: 'text too long' };
  let t = raw.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (RX_EMAIL.test(t)) return { error: 'text looks like it contains an email address' };
  if (RX_PHONE.test(t)) return { error: 'text looks like it contains a phone number' };
  if (RX_DIGITS.test(t.replace(/[\s-]/g, ''))) return { error: 'text contains a long digit run' };
  if (t.length > 80) t = t.slice(0, 79).trimEnd() + '…';
  return { text: t };
}

function loginPage(msg = '') {
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Panda Federation H.Q. — Sign in</title><style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:#1d2126;color:#e7e3da;font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
form{width:min(340px,90vw);background:#262b31;border:1px solid #39404a;border-radius:14px;padding:28px 24px;text-align:center}
img{width:96px;height:96px;border-radius:50%;object-fit:cover;border:2px solid #39404a}
h1{font-size:20px;margin:12px 0 4px;letter-spacing:.3px}p{margin:0 0 18px;color:#a7a299;font-size:14px}
input{width:100%;padding:12px;border-radius:9px;border:1px solid #4a525d;background:#1d2126;color:#e7e3da;font-size:16px}
button{margin-top:12px;width:100%;padding:12px;border:0;border-radius:9px;background:#b8433a;color:#fff;font-weight:600;font-size:16px;cursor:pointer}
.err{color:#e58a7e;margin-top:10px;font-size:14px;min-height:1em}</style></head><body>
<form method="post" action="/login"><img src="/login-crest.jpg" alt=""><h1>Panda Federation H.Q.</h1><p>Members only</p>
<input type="password" name="password" placeholder="Password" autocomplete="current-password" autofocus required>
<button type="submit">Enter</button><div class="err">${msg}</div></form></body></html>`,
  { status: msg ? 401 : 200, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...SEC_HEADERS } });
}

function stub(env) { return env.OFFICE.get(env.OFFICE.idFromName('hq')); }

export default {
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (!env.SITE_PASSWORD) return new Response('Office not configured yet.', { status: 503 });

    // --- bot push API (bearer) ---
    if (p === '/api/status' || p === '/api/usage') {
      if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405);
      if (!bearerOk(env, req)) return json({ error: 'unauthorized' }, 401);
      let body; try { body = await req.json(); } catch { return json({ error: 'bad json' }, 400); }
      if (p === '/api/status') {
        const bot = String(body.bot || '').toLowerCase();
        const state = String(body.state || '').toLowerCase();
        if (!BOTS.includes(bot)) return json({ error: 'unknown bot', allowed: BOTS }, 400);
        if (!STATES.includes(state)) return json({ error: 'bad state', allowed: STATES }, 400);
        const c = cleanText(body.text);
        if (c.error) return json({ error: c.error }, 422);
        return stub(env).fetch('https://do/status', { method: 'POST', body: JSON.stringify({ bot, state, text: c.text }) });
      }
      const pct = Number(body.percentUsed);
      const resets = new Date(body.resetsAt);
      if (!Number.isFinite(pct) || pct < 0 || pct > 1000) return json({ error: 'percentUsed must be a number 0-1000' }, 400);
      if (isNaN(resets.getTime())) return json({ error: 'resetsAt must be an ISO date' }, 400);
      return stub(env).fetch('https://do/usage', { method: 'POST', body: JSON.stringify({ percentUsed: Math.round(pct * 10) / 10, resetsAt: resets.toISOString() }) });
    }

    // --- login / logout (public) ---
    if (p === '/login-crest.jpg') return env.ASSETS.fetch(new Request(new URL('/crest-samurai.jpg', url), req));
    if (p === '/login') {
      if (req.method === 'POST') {
        const form = await req.formData().catch(() => null);
        const pw = form && form.get('password');
        if (typeof pw === 'string' && timingSafeEq(pw, env.SITE_PASSWORD)) {
          const cookie = sessionCookie(await makeSession(env));
          return new Response(null, { status: 303, headers: { Location: '/', 'Set-Cookie': cookie, 'cache-control': 'no-store' } });
        }
        await new Promise((r) => setTimeout(r, 600));
        return loginPage('Wrong password.');
      }
      return loginPage();
    }
    if (p === '/logout') {
      return new Response(null, { status: 303, headers: { Location: '/login', 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0` } });
    }

    // --- everything else needs the session cookie ---
    const sessExp = await validSession(env, req);
    if (!sessExp) {
      if (p.startsWith('/api/')) return json({ error: 'login required' }, 401);
      return new Response(null, { status: 302, headers: { Location: '/login', 'cache-control': 'no-store' } });
    }
    if (p === '/api/state') {
      if (req.method !== 'GET') return json({ error: 'method not allowed' }, 405);
      const res = await stub(env).fetch('https://do/state');
      // rolling session: an open office (polling /api/state) re-signs its cookie at most once a day, so it never logs out
      if (sessExp - Date.now() > (SESSION_DAYS - 1) * 864e5) return res;
      const out = new Response(res.body, res);
      out.headers.append('Set-Cookie', sessionCookie(await makeSession(env)));
      return out;
    }
    const res = await env.ASSETS.fetch(req);
    const out = new Response(res.body, res);
    out.headers.set('cache-control', 'private, no-cache');
    for (const [k, v] of Object.entries(SEC_HEADERS)) out.headers.set(k, v);
    return out;
  },

  async scheduled(event, env, ctx) {
    ctx.waitUntil(stub(env).fetch('https://do/heartbeat', { method: 'POST' }));
  },
};

export class OfficeState {
  constructor(state, env) { this.state = state; this.storage = state.storage; }

  async fetch(req) {
    const p = new URL(req.url).pathname;
    const now = Date.now();
    let created = await this.storage.get('createdAt');
    if (!created) { created = now; await this.storage.put('createdAt', created); }

    if (p === '/status') {
      const { bot, state, text } = await req.json();
      const rec = { state, text, updatedAt: now };
      await this.storage.put('bot:' + bot, rec);
      await this.storage.put('lastPushAt', now);
      return json({ ok: true, bot, ...rec });
    }
    if (p === '/usage') {
      const u = await req.json();
      const rec = { percentUsed: u.percentUsed, resetsAt: u.resetsAt, recordedAt: now };
      await this.storage.put('usage', rec);
      return json({ ok: true, usage: rec });
    }
    if (p === '/heartbeat') {
      await this.storage.put('heartbeatAt', now);
      return json({ ok: true, heartbeatAt: now });
    }
    if (p === '/state') {
      const all = await this.storage.get(BOTS.map((b) => 'bot:' + b));
      const bots = {};
      for (const b of BOTS) {
        const r = all.get('bot:' + b);
        if (!r) { bots[b] = { state: 'idle', text: '', updatedAt: null, effective: 'idle' }; continue; }
        const stale = (r.state === 'working' || r.state === 'done') && now - r.updatedAt > STALE_MS;
        bots[b] = { ...r, effective: stale ? 'idle' : r.state, stale };
      }
      const heartbeatAt = (await this.storage.get('heartbeatAt')) || null;
      const lastPushAt = (await this.storage.get('lastPushAt')) || null;
      const ref = heartbeatAt || created;
      const quiet = now - ref > QUIET_WARN_MS;
      return json({
        now, bots,
        usage: (await this.storage.get('usage')) || null,
        feed: { heartbeatAt, lastPushAt, quiet, quietThresholdMin: 45, staleWorkingMin: 10 },
      });
    }
    return json({ error: 'not found' }, 404);
  }
}
