#!/usr/bin/env bash
# Push a bot status to Panda Federation H.Q.
# Usage: status.sh <bot> <working|waiting|error|done|idle> "<short generic text, <=80 chars>"
# Bots: overlord moneybot stockbot superseller ledger shadow eraser kimchi scribe planner
# Never fails the caller: always exits 0, prints one short line.
BOT="${1:-}"; STATE="${2:-}"; TEXT="${3:-}"
DIR="${OFFICE3D_HOME:-/home/box/.office3d}"
URL="${OFFICE_URL:-$(cat "$DIR/url" 2>/dev/null || echo http://127.0.0.1:8787)}"
TOKEN_FILE="$DIR/status_token"
if [ -z "$BOT" ] || [ -z "$STATE" ]; then echo "usage: status.sh <bot> <state> \"<text>\""; exit 0; fi
if [ ! -r "$TOKEN_FILE" ]; then echo "status: no token file, skipped"; exit 0; fi
BODY=$(jq -cn --arg b "$BOT" --arg s "$STATE" --arg t "$TEXT" '{bot:$b,state:$s,text:$t}')
RES=$(curl -sS -m 8 -o /dev/stderr -w '%{http_code}' -X POST "$URL/api/status" \
  -H "Authorization: Bearer $(cat "$TOKEN_FILE")" -H 'content-type: application/json' --data "$BODY" 2>/tmp/.office3d_status_$$)
OUT=$(cat /tmp/.office3d_status_$$ 2>/dev/null); rm -f /tmp/.office3d_status_$$
if [ "$RES" = "200" ]; then echo "status: $BOT $STATE ok"; else echo "status: $BOT $STATE failed ($RES) $(echo "$OUT" | jq -r '.error? // empty' 2>/dev/null | head -c 120)"; fi
exit 0
