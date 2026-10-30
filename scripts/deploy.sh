#!/usr/bin/env bash
# Deploy Panda Federation H.Q. to Cloudflare Workers.
# Needs env: CLOUDFLARE_API_TOKEN, SITE_PASSWORD. STATUS_TOKEN comes from /home/box/.office3d/status_token.
# Secrets are piped to wrangler via stdin and never echoed or written to the repo.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR="${OFFICE3D_HOME:-/home/box/.office3d}"
: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN not set}"
: "${SITE_PASSWORD:?SITE_PASSWORD not set}"
[ -r "$DIR/status_token" ] || { umask 077; mkdir -p "$DIR"; openssl rand -hex 32 > "$DIR/status_token"; }
export CLOUDFLARE_API_TOKEN
if [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  CLOUDFLARE_ACCOUNT_ID=$(curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" https://api.cloudflare.com/client/v4/accounts | jq -r '.result[0].id // empty')
  [ -n "$CLOUDFLARE_ACCOUNT_ID" ] || { echo "Could not read account id (token needs Account: Read / Workers Scripts: Edit)"; exit 1; }
fi
export CLOUDFLARE_ACCOUNT_ID
echo "Account found. Building…"
npx vite build >/dev/null
echo "Deploying…"
OUT=$(npx wrangler deploy 2>&1) || { echo "$OUT" | tail -20; exit 1; }
URL=$(echo "$OUT" | grep -oE 'https://[a-zA-Z0-9.-]+\.workers\.dev' | head -1 || true)
echo "Setting secrets…"
printf '%s' "$SITE_PASSWORD" | npx wrangler secret put SITE_PASSWORD >/dev/null
tr -d '\n' < "$DIR/status_token" | npx wrangler secret put STATUS_TOKEN >/dev/null
if [ -n "$URL" ]; then (umask 077; echo "$URL" > "$DIR/url"); echo "Live at $URL (saved to $DIR/url for status.sh)"; else echo "Deployed; URL not found in output:"; echo "$OUT" | tail -8; fi
