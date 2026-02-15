#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:3000}"
EMAIL="curl-$(date +%s)@example.com"
USERNAME="curluser-$(date +%s)"
PASSWORD="TestPassword123!"

echo "[1/8] Register user"
REGISTER_RESPONSE=$(curl -sS -X POST "${API_URL}/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"${EMAIL}\",\"username\":\"${USERNAME}\",\"password\":\"${PASSWORD}\"}")
TOKEN=$(echo "${REGISTER_RESPONSE}" | jq -r '.token')

echo "[2/8] Fetch auth session"
curl -sS -X GET "${API_URL}/api/auth/session" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

echo "[3/8] Create player profile"
curl -sS -X POST "${API_URL}/api/players/me" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"displayName":"Curl Soldier","region":"ASIA","language":"en"}' | jq .

echo "[4/8] Read player profile"
curl -sS -X GET "${API_URL}/api/players/me" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

echo "[5/8] Read player stats"
curl -sS -X GET "${API_URL}/api/players/me/stats" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

echo "[6/8] Read player progression"
curl -sS -X GET "${API_URL}/api/players/me/progression" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

echo "[7/8] Read static data (weapons + maps)"
curl -sS -X GET "${API_URL}/api/static/weapons" | jq '.weapons | length'
curl -sS -X GET "${API_URL}/api/static/maps" | jq '.maps | length'

echo "[8/8] Logout"
curl -sS -X POST "${API_URL}/api/auth/logout" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

echo "Phase 1 curl checks completed"
