#!/bin/bash

API_URL="${API_URL:-http://localhost:3000}"
TOKEN=""

echo "=== Crossfire API Test Script ==="
echo "API URL: $API_URL"
echo ""

echo "1. Health Check"
curl -s "$API_URL/health" | jq .
echo ""

echo "2. API Info"
curl -s "$API_URL/api" | jq .
echo ""

echo "3. Register User"
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser123",
    "email": "test@example.com",
    "password": "TestPassword123!"
  }')

echo "$REGISTER_RESPONSE" | jq .
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')
echo ""

if [ -z "$TOKEN" ]; then
  echo "Registration failed or user already exists. Trying login..."
  
  echo "4. Login User"
  LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d '{
      "email": "test@example.com",
      "password": "TestPassword123!"
    }')
  
  echo "$LOGIN_RESPONSE" | jq .
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token // empty')
  echo ""
fi

if [ -n "$TOKEN" ]; then
  echo "5. Get Session (Authenticated)"
  curl -s "$API_URL/api/auth/session" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""

  echo "6. Refresh Token"
  REFRESH_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/refresh" \
    -H "Authorization: Bearer $TOKEN")
  echo "$REFRESH_RESPONSE" | jq .
  NEW_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.token // empty')
  
  if [ -n "$NEW_TOKEN" ]; then
    TOKEN=$NEW_TOKEN
  fi
  echo ""

  echo "7. Logout"
  curl -s -X POST "$API_URL/api/auth/logout" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

echo "=== Tests Complete ==="
