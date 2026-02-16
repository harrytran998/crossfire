#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
EMAIL="curl-$(date +%s)@example.com"
USERNAME="curluser_$(date +%s)"
PASSWORD="TestPassword123!"

echo "[1/8] Register user"
REGISTER_RESPONSE=$(curl -sS -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")
TOKEN=$(echo "${REGISTER_RESPONSE}" | jq -r '.token')
if [[ -z "${TOKEN}" || "${TOKEN}" == "null" ]]; then
  echo "Register did not return token"
  exit 1
fi

echo "[2/8] Fetch auth session"
curl -sS -X GET "${API_URL}/api/auth/session" \
  -H "Authorization: Bearer ${TOKEN}" | jq -e '.user.id != null' >/dev/null

echo "[3/8] Create player profile"
curl -sS -X POST "${API_URL}/api/players/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Curl Soldier","region":"ASIA","language":"en"}' | jq .

echo "[4/8] Read player profile"
curl -sS -X GET "${API_URL}/api/players/me" \
  -H "Authorization: Bearer ${TOKEN}" | jq -e '.player.id != null' >/dev/null

echo "[5/8] Read player stats"
curl -sS -X GET "${API_URL}/api/players/me/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq -e '.stats.playerId != null' >/dev/null

echo "[6/8] Read player progression"
curl -sS -X GET "${API_URL}/api/players/me/progression" \
  -H "Authorization: Bearer ${TOKEN}" | jq -e '.progression.playerId != null' >/dev/null

echo "[7/8] Read static data (weapons + maps)"
curl -sS -X GET "${API_URL}/api/static/weapons" | jq -e '.weapons | type == "array"' >/dev/null
curl -sS -X GET "${API_URL}/api/static/maps" | jq -e '.maps | type == "array" and length > 0' >/dev/null

echo "[8/8] Logout"
curl -sS -X POST "${API_URL}/api/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}" | jq -e '.message == "Logged out successfully"' >/dev/null

echo "Phase 1 curl checks completed"
