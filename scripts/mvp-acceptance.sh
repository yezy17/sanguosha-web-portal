#!/usr/bin/env bash
set -euo pipefail

GATEWAY="${GATEWAY:-http://127.0.0.1:8787}"
ADMIN_USERNAME="${ADMIN_USERNAME:-admin}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-CHANGE_ME}"

echo "[1/5] login"
TOKEN=$(curl -sS -X POST "$GATEWAY/api/auth/login" -H 'content-type: application/json' \
  -d "{\"username\":\"$ADMIN_USERNAME\",\"password\":\"$ADMIN_PASSWORD\"}" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d); if(!j.ok){console.error(d);process.exit(2)}; process.stdout.write(j.token)})')

echo "[2/5] create room"
ROOM_JSON=$(curl -sS -X POST "$GATEWAY/api/rooms" -H "Authorization: Bearer $TOKEN")
ROOM_ID=$(echo "$ROOM_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d); if(!j.ok){console.error(d);process.exit(2)}; process.stdout.write(j.room.roomId)})')

echo "[3/5] start match"
START_JSON=$(curl -sS -X POST "$GATEWAY/api/match/start" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"roomId\":\"$ROOM_ID\",\"mode\":\"identity\"}")
MATCH_ID=$(echo "$START_JSON" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d); if(!j.ok){console.error(d);process.exit(2)}; process.stdout.write(j.created.matchId)})')

echo "[4/5] poll status"
for i in {1..15}; do
  STATUS=$(curl -sS "$GATEWAY/api/match/status/$MATCH_ID" -H "Authorization: Bearer $TOKEN")
  STATE=$(echo "$STATUS" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d); process.stdout.write(j.engine?.state||"unknown")})')
  echo "  - poll#$i state=$STATE"
  if [[ "$STATE" == "running" || "$STATE" == "finished" || "$STATE" == "ended" ]]; then
    break
  fi
  sleep 1
done

echo "[5/5] end match"
END_JSON=$(curl -sS -X POST "$GATEWAY/api/match/end" -H "Authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"matchId\":\"$MATCH_ID\",\"reason\":\"acceptance\"}")

echo "=== SUMMARY ==="
echo "room_id=$ROOM_ID"
echo "match_id=$MATCH_ID"
echo "start=$START_JSON"
echo "end=$END_JSON"
