#!/usr/bin/env bash
# Push a real weekly-usage reading (from CheckSubscriptionUsage) to the office wall counter.
# Usage: usage.sh <percentUsed> <resetsAt ISO-8601, e.g. 2026-11-04T18:41:00-07:00>
PCT="${1:-}"; RESETS="${2:-}"
DIR="${OFFICE3D_HOME:-/home/box/.office3d}"
URL="${OFFICE_URL:-$(cat "$DIR/url" 2>/dev/null || echo http://127.0.0.1:8787)}"
if [ -z "$PCT" ] || [ -z "$RESETS" ]; then echo "usage: usage.sh <percentUsed> <resetsAtISO>"; exit 0; fi
[ -r "$DIR/status_token" ] || { echo "usage: no token file, skipped"; exit 0; }
BODY=$(jq -cn --argjson p "$PCT" --arg r "$RESETS" '{percentUsed:$p,resetsAt:$r}') || { echo "usage: bad number"; exit 0; }
CODE=$(curl -sS -m 8 -o /dev/null -w '%{http_code}' -X POST "$URL/api/usage" \
  -H "Authorization: Bearer $(cat "$DIR/status_token")" -H 'content-type: application/json' --data "$BODY")
echo "usage: push $CODE"; exit 0
